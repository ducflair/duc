"""
Main serialization functions for duc.fbs schema.
This module provides the main serialization function that leverages all comprehensive classes.
"""

import flatbuffers
import logging
import json
from typing import List, Dict, Union, Any, Optional

logger = logging.getLogger(__name__)

# Dataclasses (authoring model)
from ducpy.classes.DataStateClass import (
    ExportedDataState as DS_ExportedDataState,
    DictionaryEntry as DS_DictionaryEntry,
    DucLocalState as DS_DucLocalState,
    DucGlobalState as DS_DucGlobalState,
    VersionGraph as DS_VersionGraph,
    DucExternalFileEntry as DS_DucExternalFileEntry,
    DucExternalFileData as DS_DucExternalFileData,
    Checkpoint as DS_Checkpoint,
    Delta as DS_Delta,
    VersionBase as DS_VersionBase,
    JSONPatchOperation as DS_JSONPatchOperation,
    VersionGraphMetadata as DS_VersionGraphMetadata,
    DisplayPrecision as DS_DisplayPrecision,
)
from ducpy.classes.ElementsClass import (
    ElementWrapper as DS_ElementWrapper,
    DucRectangleElement as DS_DucRectangleElement,
    DucPolygonElement as DS_DucPolygonElement,
    DucEllipseElement as DS_DucEllipseElement,
    DucEmbeddableElement as DS_DucEmbeddableElement,
    DucPdfElement as DS_DucPdfElement,
    DucMermaidElement as DS_DucMermaidElement,
    DucTableElement as DS_DucTableElement,
    DucImageElement as DS_DucImageElement,
    DucTextElement as DS_DucTextElement,
    DucLinearElement as DS_DucLinearElement,
    DucArrowElement as DS_DucArrowElement,
    DucFreeDrawElement as DS_DucFreeDrawElement,
    DucBlockInstanceElement as DS_DucBlockInstanceElement,
    DucFrameElement as DS_DucFrameElement,
    DucPlotElement as DS_DucPlotElement,
    DucViewportElement as DS_DucViewportElement,
    DucXRayElement as DS_DucXRayElement,
    DucLeaderElement as DS_DucLeaderElement,
    DucDimensionElement as DS_DucDimensionElement,
    DucFeatureControlFrameElement as DS_DucFeatureControlFrameElement,
    DucDocElement as DS_DucDocElement,
    DucParametricElement as DS_DucParametricElement,
    DucBlock as DS_DucBlock,
    DucGroup as DS_DucGroup,
    DucRegion as DS_DucRegion,
    DucLayer as DS_DucLayer,
    ElementBackground as DS_ElementBackground,
    ElementStroke as DS_ElementStroke,
    GeometricPoint as DS_GeometricPoint,
    BoundElement as DS_BoundElement,
    DucPoint as DS_DucPoint,
    DucHead as DS_DucHead,
    DucLine as DS_DucLine,
    DucLineReference as DS_DucLineReference,
    DucPath as DS_DucPath,
    DucLinearElementBase as DS_DucLinearElementBase,
    DucElementBase as DS_DucElementBase,
    DucElementStylesBase as DS_DucElementStylesBase,
    ElementContentBase as DS_ElementContentBase,
    StrokeStyle as DS_StrokeStyle,
    StrokeSides as DS_StrokeSides,
    DucStackLikeStyles as DS_DucStackLikeStyles,
    DucStackBase as DS_DucStackBase,
    DucStackElementBase as DS_DucStackElementBase,
    LineSpacing as DS_LineSpacing,
    DucTextStyle as DS_DucTextStyle,
    DucTableCellStyle as DS_DucTableCellStyle,
    DucTableStyle as DS_DucTableStyle,
    DucLeaderStyle as DS_DucLeaderStyle,
    DimensionToleranceStyle as DS_DimensionToleranceStyle,
    DimensionFitStyle as DS_DimensionFitStyle,
    DimensionLineStyle as DS_DimensionLineStyle,
    DimensionExtLineStyle as DS_DimensionExtLineStyle,
    DimensionSymbolStyle as DS_DimensionSymbolStyle,
    DucDimensionStyle as DS_DucDimensionStyle,
    FCFLayoutStyle as DS_FCFLayoutStyle,
    FCFSymbolStyle as DS_FCFSymbolStyle,
    FCFDatumStyle as DS_FCFDatumStyle,
    DucFeatureControlFrameStyle as DS_DucFeatureControlFrameStyle,
    ParagraphFormatting as DS_ParagraphFormatting,
    StackFormatProperties as DS_StackFormatProperties,
    StackFormat as DS_StackFormat,
    DucDocStyle as DS_DucDocStyle,
    DucViewportStyle as DS_DucViewportStyle,
    DucPlotStyle as DS_DucPlotStyle,
    DucXRayStyle as DS_DucXRayStyle,
    DucTableColumn as DS_DucTableColumn,
    DucTableRow as DS_DucTableRow,
    DucTableCell as DS_DucTableCell,
    DucTableColumnEntry as DS_DucTableColumnEntry,
    DucTableRowEntry as DS_DucTableRowEntry,
    DucTableCellEntry as DS_DucTableCellEntry,
    DucTableCellSpan as DS_DucTableCellSpan,
    DucTableAutoSize as DS_DucTableAutoSize,
    ImageCrop as DS_ImageCrop,
    DucTextDynamicElementSource as DS_DucTextDynamicElementSource,
    DucTextDynamicDictionarySource as DS_DucTextDynamicDictionarySource,
    DucTextDynamicSource as DS_DucTextDynamicSource,
    DucTextDynamicPart as DS_DucTextDynamicPart,
    PointBindingPoint as DS_PointBindingPoint,
    DucPointBinding as DS_DucPointBinding,
    DucFreeDrawEnds as DS_DucFreeDrawEnds,
    StringValueEntry as DS_StringValueEntry,
    DucBlockDuplicationArray as DS_DucBlockDuplicationArray,
    PlotLayout as DS_PlotLayout,
    LeaderTextBlockContent as DS_LeaderTextBlockContent,
    LeaderBlockContent as DS_LeaderBlockContent,
    LeaderContent as DS_LeaderContent,
    DimensionDefinitionPoints as DS_DimensionDefinitionPoints,
    DimensionBindings as DS_DimensionBindings,
    DimensionBaselineData as DS_DimensionBaselineData,
    DimensionContinueData as DS_DimensionContinueData,
    DatumReference as DS_DatumReference,
    ToleranceClause as DS_ToleranceClause,
    FeatureControlFrameSegment as DS_FeatureControlFrameSegment,
    FCFSegmentRow as DS_FCFSegmentRow,
    FCFBetweenModifier as DS_FCFBetweenModifier,
    FCFProjectedZoneModifier as DS_FCFProjectedZoneModifier,
    FCFFrameModifiers as DS_FCFFrameModifiers,
    FCFDatumDefinition as DS_FCFDatumDefinition,
    TextColumn as DS_TextColumn,
    ColumnLayout as DS_ColumnLayout,
    DucCommonStyle as DS_DucCommonStyle,
    ParametricSource as DS_ParametricSource,
    DucLayerOverrides as DS_DucLayerOverrides,
    Margins as DS_Margins,
    DucBlockAttributeDefinition as DS_DucBlockAttributeDefinition,
    DucBlockAttributeDefinitionEntry as DS_DucBlockAttributeDefinitionEntry,
    TilingProperties as DS_TilingProperties,
    HatchPatternLine as DS_HatchPatternLine,
    CustomHatchPattern as DS_CustomHatchPattern,
    DucHatchStyle as DS_DucHatchStyle,
    DucImageFilter as DS_DucImageFilter,
)
from ducpy.classes.StandardsClass import (
    Standard as DS_Standard,
    Identifier as DS_Identifier,
    GridSettings as DS_GridSettings,
    GridStyle as DS_GridStyle,
    PolarGridSettings as DS_PolarGridSettings,
    IsometricGridSettings as DS_IsometricGridSettings,
    SnapSettings as DS_SnapSettings,
    SnapOverride as DS_SnapOverride,
    DynamicSnapSettings as DS_DynamicSnapSettings,
    PolarTrackingSettings as DS_PolarTrackingSettings,
    TrackingLineStyle as DS_TrackingLineStyle,
    LayerSnapFilters as DS_LayerSnapFilters,
    SnapMarkerStyle as DS_SnapMarkerStyle,
    SnapMarkerStyleEntry as DS_SnapMarkerStyleEntry,
    SnapMarkerSettings as DS_SnapMarkerSettings,
    UnitSystemBase as DS_UnitSystemBase,
    LinearUnitSystem as DS_LinearUnitSystem,
    AngularUnitSystem as DS_AngularUnitSystem,
    AlternateUnits as DS_AlternateUnits,
    PrimaryUnits as DS_PrimaryUnits,
    StandardUnits as DS_StandardUnits,
    UnitPrecision as DS_UnitPrecision,
    StandardOverrides as DS_StandardOverrides,
    IdentifiedCommonStyle as DS_IdentifiedCommonStyle,
    IdentifiedStackLikeStyle as DS_IdentifiedStackLikeStyle,
    IdentifiedTextStyle as DS_IdentifiedTextStyle,
    IdentifiedDimensionStyle as DS_IdentifiedDimensionStyle,
    IdentifiedLeaderStyle as DS_IdentifiedLeaderStyle,
    IdentifiedFCFStyle as DS_IdentifiedFCFStyle,
    IdentifiedTableStyle as DS_IdentifiedTableStyle,
    IdentifiedDocStyle as DS_IdentifiedDocStyle,
    IdentifiedViewportStyle as DS_IdentifiedViewportStyle,
    IdentifiedHatchStyle as DS_IdentifiedHatchStyle,
    IdentifiedXRayStyle as DS_IdentifiedXRayStyle,
    StandardStyles as DS_StandardStyles,
    IdentifiedGridSettings as DS_IdentifiedGridSettings,
    IdentifiedSnapSettings as DS_IdentifiedSnapSettings,
    IdentifiedUcs as DS_IdentifiedUcs,
    IdentifiedView as DS_IdentifiedView,
    StandardViewSettings as DS_StandardViewSettings,
    DimensionValidationRules as DS_DimensionValidationRules,
    LayerValidationRules as DS_LayerValidationRules,
    StandardValidation as DS_StandardValidation,
)
from ducpy._version import DUC_SCHEMA_VERSION

# Enums (generated by FlatBuffers)
from ducpy.Duc.TEXT_ALIGN import TEXT_ALIGN
from ducpy.Duc.VERTICAL_ALIGN import VERTICAL_ALIGN
from ducpy.Duc.LINE_SPACING_TYPE import LINE_SPACING_TYPE
from ducpy.Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ducpy.Duc.STROKE_CAP import STROKE_CAP
from ducpy.Duc.STROKE_JOIN import STROKE_JOIN
from ducpy.Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ducpy.Duc.STROKE_SIDE_PREFERENCE import STROKE_SIDE_PREFERENCE
from ducpy.Duc.ELEMENT_CONTENT_PREFERENCE import ELEMENT_CONTENT_PREFERENCE
from ducpy.Duc.BLENDING import BLENDING
from ducpy.Duc.LINE_HEAD import LINE_HEAD
from ducpy.Duc.BEZIER_MIRRORING import BEZIER_MIRRORING
from ducpy.Duc.IMAGE_STATUS import IMAGE_STATUS
from ducpy.Duc.TABLE_CELL_ALIGNMENT import TABLE_CELL_ALIGNMENT
from ducpy.Duc.TABLE_FLOW_DIRECTION import TABLE_FLOW_DIRECTION
from ducpy.Duc.VIEWPORT_SHADE_PLOT import VIEWPORT_SHADE_PLOT
from ducpy.Duc.HATCH_STYLE import HATCH_STYLE
from ducpy.Duc.BLOCK_ATTACHMENT import BLOCK_ATTACHMENT
from ducpy.Duc.TOLERANCE_DISPLAY import TOLERANCE_DISPLAY
from ducpy.Duc.DIMENSION_FIT_RULE import DIMENSION_FIT_RULE
from ducpy.Duc.DIMENSION_TEXT_PLACEMENT import DIMENSION_TEXT_PLACEMENT
from ducpy.Duc.MARK_ELLIPSE_CENTER import MARK_ELLIPSE_CENTER
from ducpy.Duc.DIMENSION_TYPE import DIMENSION_TYPE
from ducpy.Duc.AXIS import AXIS
from ducpy.Duc.GDT_SYMBOL import GDT_SYMBOL
from ducpy.Duc.MATERIAL_CONDITION import MATERIAL_CONDITION
from ducpy.Duc.TOLERANCE_ZONE_TYPE import TOLERANCE_ZONE_TYPE
from ducpy.Duc.COLUMN_TYPE import COLUMN_TYPE
from ducpy.Duc.TEXT_FLOW_DIRECTION import TEXT_FLOW_DIRECTION
from ducpy.Duc.PARAMETRIC_SOURCE_TYPE import PARAMETRIC_SOURCE_TYPE
from ducpy.Duc.LEADER_CONTENT_TYPE import LEADER_CONTENT_TYPE
from ducpy.Duc.BOOLEAN_OPERATION import BOOLEAN_OPERATION
from ducpy.Duc.TEXT_FIELD_SOURCE_TYPE import TEXT_FIELD_SOURCE_TYPE
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.GRID_TYPE import GRID_TYPE
from ducpy.Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
from ducpy.Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ducpy.Duc.SNAP_MODE import SNAP_MODE
from ducpy.Duc.SNAP_OVERRIDE_BEHAVIOR import SNAP_OVERRIDE_BEHAVIOR
from ducpy.Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
from ducpy.Duc.PRUNING_LEVEL import PRUNING_LEVEL

# Unions
from ducpy.Duc.Element import Element as FBS_Element
from ducpy.Duc.LeaderContentData import LeaderContentData as FBS_LeaderContentData
from ducpy.Duc.DucTextDynamicSourceData import DucTextDynamicSourceData as FBS_DucTextDynamicSourceData

# Structs
from ducpy.Duc.GeometricPoint import CreateGeometricPoint

# FlatBuffers tables (generated)
# Core and root
from ducpy.Duc.DictionaryEntry import (
    DictionaryEntryStart, DictionaryEntryAddKey, DictionaryEntryAddValue, DictionaryEntryEnd
)
from ducpy.Duc.DucUcs import (
    DucUcsStart, DucUcsAddOrigin, DucUcsAddAngle, DucUcsEnd
)
from ducpy.Duc.StringValueEntry import (
    StringValueEntryStart, StringValueEntryAddKey, StringValueEntryAddValue, StringValueEntryEnd
)
from ducpy.Duc.Identifier import (
    IdentifierStart, IdentifierAddId, IdentifierAddName, IdentifierAddDescription, IdentifierEnd
)
from ducpy.Duc.ExportedDataState import (
    ExportedDataStateStart, ExportedDataStateAddType, ExportedDataStateAddVersion, ExportedDataStateAddSource,
    ExportedDataStateAddThumbnail, ExportedDataStateAddDictionary, ExportedDataStateAddElements,
    ExportedDataStateAddBlocks, ExportedDataStateAddGroups, ExportedDataStateAddRegions,
    ExportedDataStateAddLayers, ExportedDataStateAddStandards, ExportedDataStateAddDucLocalState,
    ExportedDataStateAddDucGlobalState, ExportedDataStateAddExternalFiles, ExportedDataStateAddVersionGraph,
    ExportedDataStateEnd, ExportedDataStateStartElementsVector, ExportedDataStateStartBlocksVector,
    ExportedDataStateStartGroupsVector, ExportedDataStateStartRegionsVector, ExportedDataStateStartLayersVector,
    ExportedDataStateStartStandardsVector, ExportedDataStateStartExternalFilesVector,
    ExportedDataStateStartDictionaryVector
)

# Element common parts
from ducpy.Duc.ElementContentBase import (
    ElementContentBaseStart, ElementContentBaseAddPreference, ElementContentBaseAddSrc,
    ElementContentBaseAddVisible, ElementContentBaseAddOpacity, ElementContentBaseAddTiling,
    ElementContentBaseAddHatch, ElementContentBaseAddImageFilter, ElementContentBaseEnd
)
from ducpy.Duc.ElementStroke import (
    ElementStrokeStart, ElementStrokeAddContent, ElementStrokeAddWidth, ElementStrokeAddStyle,
    ElementStrokeAddPlacement, ElementStrokeAddStrokeSides, ElementStrokeEnd
)
from ducpy.Duc.ElementBackground import (
    ElementBackgroundStart, ElementBackgroundAddContent, ElementBackgroundEnd
)
from ducpy.Duc.StrokeStyle import (
    StrokeStyleStart, StrokeStyleAddPreference, StrokeStyleAddDash, StrokeStyleAddDashLineOverride,
    StrokeStyleAddCap, StrokeStyleAddJoin, StrokeStyleAddDashCap, StrokeStyleAddMiterLimit, StrokeStyleEnd,
    StrokeStyleStartDashVector
)
from ducpy.Duc.StrokeSides import (
    StrokeSidesStart, StrokeSidesAddPreference, StrokeSidesAddValues, StrokeSidesEnd,
    StrokeSidesStartValuesVector
)
from ducpy.Duc._DucElementStylesBase import (
    _DucElementStylesBaseStart,
    _DucElementStylesBaseAddBackground,
    _DucElementStylesBaseAddStroke,
    _DucElementStylesBaseAddOpacity,
    _DucElementStylesBaseAddRoundness,
    _DucElementStylesBaseAddBlending,
    _DucElementStylesBaseEnd,
    _DucElementStylesBaseStartBackgroundVector,
    _DucElementStylesBaseStartStrokeVector
)

# Backwards-compatible aliases expected by the rest of this module
DucElementStylesBaseStart = _DucElementStylesBaseStart
DucElementStylesBaseAddRoundness = _DucElementStylesBaseAddRoundness
DucElementStylesBaseAddBlending = _DucElementStylesBaseAddBlending
DucElementStylesBaseAddBackground = _DucElementStylesBaseAddBackground
DucElementStylesBaseAddStroke = _DucElementStylesBaseAddStroke
DucElementStylesBaseAddOpacity = _DucElementStylesBaseAddOpacity
DucElementStylesBaseEnd = _DucElementStylesBaseEnd
DucElementStylesBaseStartBackgroundVector = _DucElementStylesBaseStartBackgroundVector
DucElementStylesBaseStartStrokeVector = _DucElementStylesBaseStartStrokeVector

# Linear element base vectors
from ducpy.Duc._DucLinearElementBase import (
    _DucLinearElementBaseStart,
    _DucLinearElementBaseAddBase,
    _DucLinearElementBaseAddPoints,
    _DucLinearElementBaseAddLines,
    _DucLinearElementBaseAddPathOverrides,
    _DucLinearElementBaseAddLastCommittedPoint,
    _DucLinearElementBaseAddStartBinding,
    _DucLinearElementBaseAddEndBinding,
    _DucLinearElementBaseEnd,
    _DucLinearElementBaseStartPointsVector,
    _DucLinearElementBaseStartLinesVector,
    _DucLinearElementBaseStartPathOverridesVector
)

# Backwards-compatible aliases for linear element base
DucLinearElementBaseStart = _DucLinearElementBaseStart
DucLinearElementBaseAddBase = _DucLinearElementBaseAddBase
DucLinearElementBaseAddPoints = _DucLinearElementBaseAddPoints
DucLinearElementBaseAddLines = _DucLinearElementBaseAddLines
DucLinearElementBaseAddPathOverrides = _DucLinearElementBaseAddPathOverrides
DucLinearElementBaseAddLastCommittedPoint = _DucLinearElementBaseAddLastCommittedPoint
DucLinearElementBaseAddStartBinding = _DucLinearElementBaseAddStartBinding
DucLinearElementBaseAddEndBinding = _DucLinearElementBaseAddEndBinding
DucLinearElementBaseEnd = _DucLinearElementBaseEnd

# Backwards-compatible aliases for linear element base vectors
DucLinearElementBaseStartPointsVector = _DucLinearElementBaseStartPointsVector
DucLinearElementBaseStartLinesVector = _DucLinearElementBaseStartLinesVector
DucLinearElementBaseStartPathOverridesVector = _DucLinearElementBaseStartPathOverridesVector

from ducpy.Duc.BoundElement import (
    BoundElementStart, BoundElementAddId, BoundElementAddType, BoundElementEnd
)
from ducpy.Duc.DucPoint import (
    DucPointStart, DucPointAddX, DucPointAddY, DucPointAddMirroring, DucPointEnd
)
from ducpy.Duc.DucHead import (
    DucHeadStart, DucHeadAddType, DucHeadAddBlockId, DucHeadAddSize, DucHeadEnd
)
from ducpy.Duc.PointBindingPoint import (
    PointBindingPointStart, PointBindingPointAddIndex, PointBindingPointAddOffset, PointBindingPointEnd
)
from ducpy.Duc.DucPointBinding import (
    DucPointBindingStart, DucPointBindingAddElementId, DucPointBindingAddFocus, DucPointBindingAddGap,
    DucPointBindingAddFixedPoint, DucPointBindingAddPoint, DucPointBindingAddHead, DucPointBindingEnd
)
from ducpy.Duc.DucLineReference import (
    DucLineReferenceStart, DucLineReferenceAddIndex, DucLineReferenceAddHandle, DucLineReferenceEnd
)
from ducpy.Duc.DucLine import (
    DucLineStart, DucLineAddStart, DucLineAddEnd, DucLineEnd
)
from ducpy.Duc.DucPath import (
    DucPathStart, DucPathAddLineIndices, DucPathAddBackground, DucPathAddStroke, DucPathEnd,
    DucPathStartLineIndicesVector
)
from ducpy.Duc._DucElementBase import (
    _DucElementBaseStart,
    _DucElementBaseAddId,
    _DucElementBaseAddStyles,
    _DucElementBaseAddX,
    _DucElementBaseAddY,
    _DucElementBaseAddWidth,
    _DucElementBaseAddHeight,
    _DucElementBaseAddAngle,
    _DucElementBaseAddScope,
    _DucElementBaseAddLabel,
    _DucElementBaseAddDescription,
    _DucElementBaseAddIsVisible,
    _DucElementBaseAddSeed,
    _DucElementBaseAddVersion,
    _DucElementBaseAddVersionNonce,
    _DucElementBaseAddUpdated,
    _DucElementBaseAddIndex,
    _DucElementBaseAddIsPlot,
    _DucElementBaseAddIsAnnotative,
    _DucElementBaseAddIsDeleted,
    _DucElementBaseAddGroupIds,
    _DucElementBaseAddRegionIds,
    _DucElementBaseAddLayerId,
    _DucElementBaseAddFrameId,
    _DucElementBaseAddBoundElements,
    _DucElementBaseAddZIndex,
    _DucElementBaseAddLink,
    _DucElementBaseAddLocked,
    _DucElementBaseAddCustomData,
    _DucElementBaseEnd,
    _DucElementBaseStartGroupIdsVector,
    _DucElementBaseStartRegionIdsVector,
    _DucElementBaseStartBoundElementsVector
)
from ducpy.Duc.DucStackLikeStyles import (
    DucStackLikeStylesStart, DucStackLikeStylesAddOpacity, DucStackLikeStylesAddLabelingColor,
    DucStackLikeStylesEnd
)
from ducpy.Duc._DucStackBase import (
    _DucStackBaseStart, _DucStackBaseAddLabel, _DucStackBaseAddDescription,
    _DucStackBaseAddIsCollapsed, _DucStackBaseAddIsPlot, _DucStackBaseAddIsVisible,
    _DucStackBaseAddLocked, _DucStackBaseAddStyles, _DucStackBaseEnd
)
from ducpy.Duc._DucStackElementBase import (
    _DucStackElementBaseStart, _DucStackElementBaseAddBase, _DucStackElementBaseAddStackBase,
    _DucStackElementBaseAddClip, _DucStackElementBaseAddLabelVisible, _DucStackElementBaseAddStandardOverride,
    _DucStackElementBaseEnd
)

# Backwards-compatible aliases expected by the rest of this module
DucStackElementBaseStart = _DucStackElementBaseStart
DucStackElementBaseAddBase = _DucStackElementBaseAddBase
DucStackElementBaseAddStackBase = _DucStackElementBaseAddStackBase
DucStackElementBaseAddClip = _DucStackElementBaseAddClip
DucStackElementBaseAddLabelVisible = _DucStackElementBaseAddLabelVisible
DucStackElementBaseAddStandardOverride = _DucStackElementBaseAddStandardOverride
DucStackElementBaseEnd = _DucStackElementBaseEnd

# Misc style tables
from ducpy.Duc.LineSpacing import (
    LineSpacingStart, LineSpacingAddValue, LineSpacingAddType, LineSpacingEnd
)
from ducpy.Duc.DucTextStyle import (
    DucTextStyleStart, DucTextStyleAddBaseStyle, DucTextStyleAddIsLtr, DucTextStyleAddFontFamily,
    DucTextStyleAddBigFontFamily, DucTextStyleAddTextAlign, DucTextStyleAddVerticalAlign,
    DucTextStyleAddLineHeight, DucTextStyleAddLineSpacing, DucTextStyleAddObliqueAngle, DucTextStyleAddFontSize,
    DucTextStyleAddPaperTextHeight, DucTextStyleAddWidthFactor, DucTextStyleAddIsUpsideDown,
    DucTextStyleAddIsBackwards, DucTextStyleEnd
)
from ducpy.Duc.Margins import (
    MarginsStart, MarginsAddTop, MarginsAddRight, MarginsAddBottom, MarginsAddLeft, MarginsEnd
)
from ducpy.Duc.DucTableCellStyle import (
    DucTableCellStyleStart, DucTableCellStyleAddBaseStyle, DucTableCellStyleAddTextStyle,
    DucTableCellStyleAddMargins, DucTableCellStyleAddAlignment, DucTableCellStyleEnd
)
from ducpy.Duc.DucTableStyle import (
    DucTableStyleStart, DucTableStyleAddBaseStyle, DucTableStyleAddFlowDirection,
    DucTableStyleAddHeaderRowStyle, DucTableStyleAddDataRowStyle, DucTableStyleAddDataColumnStyle, DucTableStyleEnd
)
from ducpy.Duc.DucLeaderStyle import (
    DucLeaderStyleStart, DucLeaderStyleAddBaseStyle, DucLeaderStyleAddHeadsOverride, DucLeaderStyleAddDogleg,
    DucLeaderStyleAddTextStyle, DucLeaderStyleAddTextAttachment, DucLeaderStyleAddBlockAttachment, DucLeaderStyleEnd,
    DucLeaderStyleStartHeadsOverrideVector
)
from ducpy.Duc.DimensionToleranceStyle import (
    DimensionToleranceStyleStart, DimensionToleranceStyleAddEnabled, DimensionToleranceStyleAddDisplayMethod,
    DimensionToleranceStyleAddUpperValue, DimensionToleranceStyleAddLowerValue, DimensionToleranceStyleAddPrecision,
    DimensionToleranceStyleAddTextStyle, DimensionToleranceStyleEnd
)
from ducpy.Duc.DimensionFitStyle import (
    DimensionFitStyleStart, DimensionFitStyleAddRule, DimensionFitStyleAddTextPlacement,
    DimensionFitStyleAddForceTextInside, DimensionFitStyleEnd
)
from ducpy.Duc.DimensionLineStyle import (
    DimensionLineStyleStart, DimensionLineStyleAddStroke, DimensionLineStyleAddTextGap, DimensionLineStyleEnd
)
from ducpy.Duc.DimensionExtLineStyle import (
    DimensionExtLineStyleStart, DimensionExtLineStyleAddStroke, DimensionExtLineStyleAddOvershoot,
    DimensionExtLineStyleAddOffset, DimensionExtLineStyleEnd
)
from ducpy.Duc.DucDimensionStyle import (
    DucDimensionStyleStart, DucDimensionStyleAddDimLine, DucDimensionStyleAddExtLine, DucDimensionStyleAddTextStyle,
    DucDimensionStyleAddSymbols, DucDimensionStyleAddTolerance, DucDimensionStyleAddFit, DucDimensionStyleEnd
)
from ducpy.Duc.DimensionSymbolStyle import (
    DimensionSymbolStyleStart, DimensionSymbolStyleAddHeadsOverride, DimensionSymbolStyleAddCenterMarkType,
    DimensionSymbolStyleAddCenterMarkSize, DimensionSymbolStyleEnd, DimensionSymbolStyleStartHeadsOverrideVector
)
from ducpy.Duc.FCFLayoutStyle import (
    FCFLayoutStyleStart, FCFLayoutStyleAddPadding, FCFLayoutStyleAddSegmentSpacing, FCFLayoutStyleAddRowSpacing,
    FCFLayoutStyleEnd
)
from ducpy.Duc.FCFSymbolStyle import (
    FCFSymbolStyleStart, FCFSymbolStyleAddScale, FCFSymbolStyleEnd
)
from ducpy.Duc.FCFDatumStyle import (
    FCFDatumStyleStart, FCFDatumStyleAddBracketStyle, FCFDatumStyleEnd
)
from ducpy.Duc.DucFeatureControlFrameStyle import (
    DucFeatureControlFrameStyleStart, DucFeatureControlFrameStyleAddBaseStyle, DucFeatureControlFrameStyleAddTextStyle,
    DucFeatureControlFrameStyleAddLayout, DucFeatureControlFrameStyleAddSymbols, DucFeatureControlFrameStyleAddDatumStyle,
    DucFeatureControlFrameStyleEnd
)
from ducpy.Duc.ParagraphFormatting import (
    ParagraphFormattingStart, ParagraphFormattingAddFirstLineIndent, ParagraphFormattingAddHangingIndent,
    ParagraphFormattingAddLeftIndent, ParagraphFormattingAddRightIndent, ParagraphFormattingAddSpaceBefore,
    ParagraphFormattingAddSpaceAfter, ParagraphFormattingAddTabStops, ParagraphFormattingEnd,
    ParagraphFormattingStartTabStopsVector
)
from ducpy.Duc.StackFormatProperties import (
    StackFormatPropertiesStart, StackFormatPropertiesAddUpperScale, StackFormatPropertiesAddLowerScale,
    StackFormatPropertiesAddAlignment, StackFormatPropertiesEnd
)
from ducpy.Duc.StackFormat import (
    StackFormatStart, StackFormatAddAutoStack, StackFormatAddStackChars, StackFormatAddProperties, StackFormatEnd,
    StackFormatStartStackCharsVector
)
from ducpy.Duc.DucDocStyle import (
    DucDocStyleStart, DucDocStyleAddTextStyle, DucDocStyleAddParagraph, DucDocStyleAddStackFormat, DucDocStyleEnd
)
from ducpy.Duc.DucViewportStyle import (
    DucViewportStyleStart, DucViewportStyleAddBaseStyle, DucViewportStyleAddScaleIndicatorVisible, DucViewportStyleEnd
)
from ducpy.Duc.DucPlotStyle import (
    DucPlotStyleStart, DucPlotStyleAddBaseStyle, DucPlotStyleEnd
)
from ducpy.Duc.DucXRayStyle import (
    DucXRayStyleStart, DucXRayStyleAddBaseStyle, DucXRayStyleAddColor, DucXRayStyleEnd
)
from ducpy.Duc.TilingProperties import (
    TilingPropertiesStart, TilingPropertiesAddSizeInPercent, TilingPropertiesAddAngle, TilingPropertiesAddSpacing,
    TilingPropertiesAddOffsetX, TilingPropertiesAddOffsetY, TilingPropertiesEnd
)
from ducpy.Duc.HatchPatternLine import (
    HatchPatternLineStart, HatchPatternLineAddAngle, HatchPatternLineAddOrigin, HatchPatternLineAddOffset,
    HatchPatternLineAddDashPattern, HatchPatternLineEnd, HatchPatternLineStartOffsetVector,
    HatchPatternLineStartDashPatternVector
)
from ducpy.Duc.CustomHatchPattern import (
    CustomHatchPatternStart, CustomHatchPatternAddName, CustomHatchPatternAddDescription,
    CustomHatchPatternAddLines, CustomHatchPatternEnd, CustomHatchPatternStartLinesVector
)
from ducpy.Duc.DucHatchStyle import (
    DucHatchStyleStart, DucHatchStyleAddHatchStyle, DucHatchStyleAddPatternName, DucHatchStyleAddPatternScale,
    DucHatchStyleAddPatternAngle, DucHatchStyleAddPatternOrigin, DucHatchStyleAddPatternDouble,
    DucHatchStyleAddCustomPattern, DucHatchStyleEnd
)
from ducpy.Duc.DucImageFilter import (
    DucImageFilterStart, DucImageFilterAddBrightness, DucImageFilterAddContrast, DucImageFilterEnd
)

# Element tables
from ducpy.Duc.DucRectangleElement import (
    DucRectangleElementStart, DucRectangleElementAddBase, DucRectangleElementEnd
)
from ducpy.Duc.DucPolygonElement import (
    DucPolygonElementStart, DucPolygonElementAddBase, DucPolygonElementAddSides, DucPolygonElementEnd
)
from ducpy.Duc.DucEllipseElement import (
    DucEllipseElementStart, DucEllipseElementAddBase, DucEllipseElementAddRatio, DucEllipseElementAddStartAngle,
    DucEllipseElementAddEndAngle, DucEllipseElementAddShowAuxCrosshair, DucEllipseElementEnd
)
from ducpy.Duc.DucEmbeddableElement import (
    DucEmbeddableElementStart, DucEmbeddableElementAddBase, DucEmbeddableElementEnd
)
from ducpy.Duc.DucPdfElement import (
    DucPdfElementStart, DucPdfElementAddBase, DucPdfElementAddFileId, DucPdfElementEnd
)
from ducpy.Duc.DucMermaidElement import (
    DucMermaidElementStart, DucMermaidElementAddBase, DucMermaidElementAddSource, DucMermaidElementAddTheme,
    DucMermaidElementAddSvgPath, DucMermaidElementEnd
)
from ducpy.Duc.DucTableColumn import (
    DucTableColumnStart, DucTableColumnAddId, DucTableColumnAddWidth, DucTableColumnAddStyleOverrides,
    DucTableColumnEnd
)
from ducpy.Duc.DucTableRow import (
    DucTableRowStart, DucTableRowAddId, DucTableRowAddHeight, DucTableRowAddStyleOverrides, DucTableRowEnd
)
from ducpy.Duc.DucTableCellSpan import (
    DucTableCellSpanStart, DucTableCellSpanAddColumns, DucTableCellSpanAddRows, DucTableCellSpanEnd
)
from ducpy.Duc.DucTableCell import (
    DucTableCellStart, DucTableCellAddRowId, DucTableCellAddColumnId, DucTableCellAddData, DucTableCellAddSpan,
    DucTableCellAddLocked, DucTableCellAddStyleOverrides, DucTableCellEnd
)
from ducpy.Duc.DucTableColumnEntry import (
    DucTableColumnEntryStart, DucTableColumnEntryAddKey, DucTableColumnEntryAddValue, DucTableColumnEntryEnd
)
from ducpy.Duc.DucTableRowEntry import (
    DucTableRowEntryStart, DucTableRowEntryAddKey, DucTableRowEntryAddValue, DucTableRowEntryEnd
)
from ducpy.Duc.DucTableCellEntry import (
    DucTableCellEntryStart, DucTableCellEntryAddKey, DucTableCellEntryAddValue, DucTableCellEntryEnd
)
from ducpy.Duc.DucTableAutoSize import (
    DucTableAutoSizeStart, DucTableAutoSizeAddColumns, DucTableAutoSizeAddRows, DucTableAutoSizeEnd
)
from ducpy.Duc.DucTableElement import (
    DucTableElementStart, DucTableElementAddBase, DucTableElementAddStyle, DucTableElementAddColumnOrder,
    DucTableElementAddRowOrder, DucTableElementAddColumns, DucTableElementAddRows, DucTableElementAddCells,
    DucTableElementAddHeaderRowCount, DucTableElementAddAutoSize, DucTableElementEnd,
    DucTableElementStartColumnOrderVector, DucTableElementStartRowOrderVector, DucTableElementStartColumnsVector,
    DucTableElementStartRowsVector, DucTableElementStartCellsVector
)
from ducpy.Duc.ImageCrop import (
    ImageCropStart, ImageCropAddX, ImageCropAddY, ImageCropAddWidth, ImageCropAddHeight,
    ImageCropAddNaturalWidth, ImageCropAddNaturalHeight, ImageCropEnd
)
from ducpy.Duc.DucImageElement import (
    DucImageElementStart, DucImageElementAddBase, DucImageElementAddFileId, DucImageElementAddStatus,
    DucImageElementAddScale, DucImageElementAddCrop, DucImageElementAddFilter, DucImageElementEnd,
    DucImageElementStartScaleVector
)
from ducpy.Duc.DucTextDynamicElementSource import (
    DucTextDynamicElementSourceStart, DucTextDynamicElementSourceAddElementId, DucTextDynamicElementSourceAddProperty,
    DucTextDynamicElementSourceEnd
)
from ducpy.Duc.DucTextDynamicDictionarySource import (
    DucTextDynamicDictionarySourceStart, DucTextDynamicDictionarySourceAddKey, DucTextDynamicDictionarySourceEnd
)
from ducpy.Duc.DucTextDynamicSource import (
    DucTextDynamicSourceStart, DucTextDynamicSourceAddTextSourceType, DucTextDynamicSourceAddSourceType,
    DucTextDynamicSourceAddSource, DucTextDynamicSourceEnd
)
from ducpy.Duc.DucTextDynamicPart import (
    DucTextDynamicPartStart, DucTextDynamicPartAddTag, DucTextDynamicPartAddSource, DucTextDynamicPartAddFormatting,
    DucTextDynamicPartAddCachedValue, DucTextDynamicPartEnd
)
from ducpy.Duc.DucTextElement import (
    DucTextElementStart, DucTextElementAddBase, DucTextElementAddStyle, DucTextElementAddText,
    DucTextElementAddDynamic, DucTextElementAddAutoResize, DucTextElementAddContainerId,
    DucTextElementAddOriginalText, DucTextElementEnd, DucTextElementStartDynamicVector
)
from ducpy.Duc._DucLinearElementBase import (
    _DucLinearElementBaseStart, _DucLinearElementBaseAddBase, _DucLinearElementBaseAddPoints, _DucLinearElementBaseAddLines,
    _DucLinearElementBaseAddPathOverrides, _DucLinearElementBaseAddLastCommittedPoint, _DucLinearElementBaseAddStartBinding,
    _DucLinearElementBaseAddEndBinding, _DucLinearElementBaseEnd, _DucLinearElementBaseStartPointsVector,
    _DucLinearElementBaseStartLinesVector, _DucLinearElementBaseStartPathOverridesVector
)
from ducpy.Duc.DucLinearElement import (
    DucLinearElementStart, DucLinearElementAddLinearBase, DucLinearElementAddWipeoutBelow, DucLinearElementEnd
)
from ducpy.Duc.DucArrowElement import (
    DucArrowElementStart, DucArrowElementAddLinearBase, DucArrowElementAddElbowed, DucArrowElementEnd
)
from ducpy.Duc.DucFreeDrawEnds import (
    DucFreeDrawEndsStart, DucFreeDrawEndsAddCap, DucFreeDrawEndsAddTaper, DucFreeDrawEndsAddEasing, DucFreeDrawEndsEnd
)
from ducpy.Duc.DucFreeDrawElement import (
    DucFreeDrawElementStart, DucFreeDrawElementAddBase, DucFreeDrawElementAddPoints, DucFreeDrawElementAddSize,
    DucFreeDrawElementAddThinning, DucFreeDrawElementAddSmoothing, DucFreeDrawElementAddStreamline,
    DucFreeDrawElementAddEasing, DucFreeDrawElementAddStart, DucFreeDrawElementAddEnd, DucFreeDrawElementAddPressures,
    DucFreeDrawElementAddSimulatePressure, DucFreeDrawElementAddLastCommittedPoint, DucFreeDrawElementAddSvgPath,
    DucFreeDrawElementEnd, DucFreeDrawElementStartPointsVector, DucFreeDrawElementStartPressuresVector
)
from ducpy.Duc.DucBlockInstanceElement import (
    DucBlockInstanceElementStart, DucBlockInstanceElementAddBase, DucBlockInstanceElementAddBlockId,
    DucBlockInstanceElementAddElementOverrides, DucBlockInstanceElementAddAttributeValues,
    DucBlockInstanceElementAddDuplicationArray, DucBlockInstanceElementEnd,
    DucBlockInstanceElementStartElementOverridesVector, DucBlockInstanceElementStartAttributeValuesVector
)
from ducpy.Duc.DucBlockDuplicationArray import (
    DucBlockDuplicationArrayStart, DucBlockDuplicationArrayAddRows, DucBlockDuplicationArrayAddCols,
    DucBlockDuplicationArrayAddRowSpacing, DucBlockDuplicationArrayAddColSpacing, DucBlockDuplicationArrayEnd
)
from ducpy.Duc.DucFrameElement import (
    DucFrameElementStart, DucFrameElementAddStackElementBase, DucFrameElementEnd
)
from ducpy.Duc.DucPlotStyle import (
    DucPlotStyleStart, DucPlotStyleAddBaseStyle, DucPlotStyleEnd
)
from ducpy.Duc.PlotLayout import (
    PlotLayoutStart, PlotLayoutAddMargins, PlotLayoutEnd
)
from ducpy.Duc.DucPlotElement import (
    DucPlotElementStart, DucPlotElementAddStackElementBase, DucPlotElementAddStyle, DucPlotElementAddLayout,
    DucPlotElementEnd
)
from ducpy.Duc.DucView import (
    DucViewStart, DucViewAddScrollX, DucViewAddScrollY, DucViewAddZoom, DucViewAddTwistAngle,
    DucViewAddCenterPoint, DucViewAddScope, DucViewEnd
)
from ducpy.Duc.DucViewportStyle import (
    DucViewportStyleStart, DucViewportStyleAddBaseStyle, DucViewportStyleAddScaleIndicatorVisible, DucViewportStyleEnd
)
from ducpy.Duc.DucViewportElement import (
    DucViewportElementStart, DucViewportElementAddLinearBase, DucViewportElementAddStackBase,
    DucViewportElementAddStyle, DucViewportElementAddView, DucViewportElementAddScale,
    DucViewportElementAddShadePlot, DucViewportElementAddFrozenGroupIds, DucViewportElementAddStandardOverride,
    DucViewportElementEnd, DucViewportElementStartFrozenGroupIdsVector
)
from ducpy.Duc.DucXRayElement import (
    DucXRayElementStart, DucXRayElementAddBase, DucXRayElementAddStyle, DucXRayElementAddOrigin,
    DucXRayElementAddDirection, DucXRayElementAddStartFromOrigin, DucXRayElementEnd
)
from ducpy.Duc.LeaderTextBlockContent import (
    LeaderTextBlockContentStart, LeaderTextBlockContentAddText, LeaderTextBlockContentEnd
)
from ducpy.Duc.LeaderBlockContent import (
    LeaderBlockContentStart, LeaderBlockContentAddBlockId, LeaderBlockContentAddAttributeValues,
    LeaderBlockContentAddElementOverrides, LeaderBlockContentEnd, LeaderBlockContentStartAttributeValuesVector,
    LeaderBlockContentStartElementOverridesVector
)
from ducpy.Duc.LeaderContent import (
    LeaderContentStart, LeaderContentAddLeaderContentType, LeaderContentAddContentType,
    LeaderContentAddContent, LeaderContentEnd
)
from ducpy.Duc.DucLeaderElement import (
    DucLeaderElementStart, DucLeaderElementAddLinearBase, DucLeaderElementAddStyle, DucLeaderElementAddContent,
    DucLeaderElementAddContentAnchor, DucLeaderElementEnd
)
from ducpy.Duc.DimensionDefinitionPoints import (
    DimensionDefinitionPointsStart, DimensionDefinitionPointsAddOrigin1, DimensionDefinitionPointsAddOrigin2,
    DimensionDefinitionPointsAddLocation, DimensionDefinitionPointsAddCenter, DimensionDefinitionPointsAddJog,
    DimensionDefinitionPointsEnd
)
from ducpy.Duc.DimensionBindings import (
    DimensionBindingsStart, DimensionBindingsAddOrigin1, DimensionBindingsAddOrigin2,
    DimensionBindingsAddCenter, DimensionBindingsEnd
)
from ducpy.Duc.DimensionBaselineData import (
    DimensionBaselineDataStart, DimensionBaselineDataAddBaseDimensionId, DimensionBaselineDataEnd
)
from ducpy.Duc.DimensionContinueData import (
    DimensionContinueDataStart, DimensionContinueDataAddContinueFromDimensionId, DimensionContinueDataEnd
)
from ducpy.Duc.DucDimensionElement import (
    DucDimensionElementStart, DucDimensionElementAddBase, DucDimensionElementAddStyle,
    DucDimensionElementAddDimensionType, DucDimensionElementAddDefinitionPoints, DucDimensionElementAddObliqueAngle,
    DucDimensionElementAddOrdinateAxis, DucDimensionElementAddBindings, DucDimensionElementAddTextOverride,
    DucDimensionElementAddTextPosition, DucDimensionElementAddToleranceOverride, DucDimensionElementAddBaselineData,
    DucDimensionElementAddContinueData, DucDimensionElementEnd
)
from ducpy.Duc.DatumReference import (
    DatumReferenceStart, DatumReferenceAddLetters, DatumReferenceAddModifier, DatumReferenceEnd
)
from ducpy.Duc.ToleranceClause import (
    ToleranceClauseStart, ToleranceClauseAddValue, ToleranceClauseAddZoneType, ToleranceClauseAddFeatureModifiers,
    ToleranceClauseAddMaterialCondition, ToleranceClauseEnd, ToleranceClauseStartFeatureModifiersVector
)
from ducpy.Duc.FeatureControlFrameSegment import (
    FeatureControlFrameSegmentStart, FeatureControlFrameSegmentAddSymbol, FeatureControlFrameSegmentAddTolerance,
    FeatureControlFrameSegmentAddDatums, FeatureControlFrameSegmentEnd, FeatureControlFrameSegmentStartDatumsVector
)
from ducpy.Duc.FCFBetweenModifier import (
    FCFBetweenModifierStart, FCFBetweenModifierAddStart, FCFBetweenModifierAddEnd, FCFBetweenModifierEnd
)
from ducpy.Duc.FCFProjectedZoneModifier import (
    FCFProjectedZoneModifierStart, FCFProjectedZoneModifierAddValue, FCFProjectedZoneModifierEnd
)
from ducpy.Duc.FCFFrameModifiers import (
    FCFFrameModifiersStart, FCFFrameModifiersAddAllAround, FCFFrameModifiersAddAllOver,
    FCFFrameModifiersAddContinuousFeature, FCFFrameModifiersAddBetween, FCFFrameModifiersAddProjectedToleranceZone,
    FCFFrameModifiersEnd
)
from ducpy.Duc.FCFDatumDefinition import (
    FCFDatumDefinitionStart, FCFDatumDefinitionAddLetter, FCFDatumDefinitionAddFeatureBinding, FCFDatumDefinitionEnd
)
from ducpy.Duc.FCFSegmentRow import (
    FCFSegmentRowStart, FCFSegmentRowAddSegments, FCFSegmentRowEnd, FCFSegmentRowStartSegmentsVector
)
from ducpy.Duc.DucFeatureControlFrameElement import (
    DucFeatureControlFrameElementStart, DucFeatureControlFrameElementAddBase, DucFeatureControlFrameElementAddStyle,
    DucFeatureControlFrameElementAddRows, DucFeatureControlFrameElementAddFrameModifiers,
    DucFeatureControlFrameElementAddLeaderElementId, DucFeatureControlFrameElementAddDatumDefinition,
    DucFeatureControlFrameElementEnd, DucFeatureControlFrameElementStartRowsVector
)
from ducpy.Duc.TextColumn import (
    TextColumnStart, TextColumnAddWidth, TextColumnAddGutter, TextColumnEnd
)
from ducpy.Duc.ColumnLayout import (
    ColumnLayoutStart, ColumnLayoutAddType, ColumnLayoutAddDefinitions, ColumnLayoutAddAutoHeight, ColumnLayoutEnd,
    ColumnLayoutStartDefinitionsVector
)
from ducpy.Duc.DucDocElement import (
    DucDocElementStart, DucDocElementAddBase, DucDocElementAddStyle, DucDocElementAddText, DucDocElementAddDynamic,
    DucDocElementAddFlowDirection, DucDocElementAddColumns, DucDocElementAddAutoResize, DucDocElementEnd,
    DucDocElementStartDynamicVector
)
from ducpy.Duc.ParametricSource import (
    ParametricSourceStart, ParametricSourceAddType, ParametricSourceAddCode, ParametricSourceAddFileId,
    ParametricSourceEnd
)
from ducpy.Duc.DucParametricElement import (
    DucParametricElementStart, DucParametricElementAddBase, DucParametricElementAddSource, DucParametricElementEnd
)
from ducpy.Duc.ElementWrapper import (
    ElementWrapperStart, ElementWrapperAddElementType, ElementWrapperAddElement, ElementWrapperEnd
)

# Groups, regions, layers (builders will be imported in Part 2 but used later)
from ducpy.Duc.DucGroup import DucGroupStart, DucGroupAddId, DucGroupAddStackBase, DucGroupEnd
from ducpy.Duc.DucRegion import DucRegionStart, DucRegionAddId, DucRegionAddStackBase, DucRegionAddBooleanOperation, DucRegionEnd
from ducpy.Duc.DucLayerOverrides import DucLayerOverridesStart, DucLayerOverridesAddStroke, DucLayerOverridesAddBackground, DucLayerOverridesEnd
from ducpy.Duc.DucLayer import DucLayerStart, DucLayerAddId, DucLayerAddStackBase, DucLayerAddReadonly, DucLayerAddOverrides, DucLayerEnd

# Utility helpers

def _str(builder: flatbuffers.Builder, s: Optional[str]) -> int:
    return builder.CreateString(s) if s else 0

def _bytes_vec(builder: flatbuffers.Builder, b: Optional[bytes]) -> int:
    return builder.CreateByteVector(b) if b else 0

# =============================================================================
# Utility & geometry serializers
# =============================================================================

def serialize_fbs_dictionary_entry(builder: flatbuffers.Builder, entry: DS_DictionaryEntry) -> int:
    key_offset = builder.CreateString(entry.key)
    value_offset = builder.CreateString(entry.value)
    DictionaryEntryStart(builder)
    DictionaryEntryAddKey(builder, key_offset)
    DictionaryEntryAddValue(builder, value_offset)
    return DictionaryEntryEnd(builder)

def serialize_fbs_string_value_entry(builder: flatbuffers.Builder, entry: DS_StringValueEntry) -> int:
    key_offset = builder.CreateString(entry.key)
    value_offset = builder.CreateString(entry.value)
    StringValueEntryStart(builder)
    StringValueEntryAddKey(builder, key_offset)
    StringValueEntryAddValue(builder, value_offset)
    return StringValueEntryEnd(builder)

def serialize_fbs_identifier(builder: flatbuffers.Builder, identifier: DS_Identifier) -> int:
    id_offset = builder.CreateString(identifier.id)
    name_offset = builder.CreateString(identifier.name)
    description_offset = builder.CreateString(identifier.description)
    IdentifierStart(builder)
    IdentifierAddId(builder, id_offset)
    IdentifierAddName(builder, name_offset)
    IdentifierAddDescription(builder, description_offset)
    return IdentifierEnd(builder)

def serialize_fbs_duc_point(builder: flatbuffers.Builder, point: Optional[DS_DucPoint]) -> int:
    if point is None:
        return 0
    DucPointStart(builder)
    DucPointAddX(builder, point.x)
    DucPointAddY(builder, point.y)
    if point.mirroring is not None:
        DucPointAddMirroring(builder, point.mirroring)
    return DucPointEnd(builder)

def serialize_fbs_margins(builder: flatbuffers.Builder, margins: Optional[DS_Margins]) -> int:
    if margins is None:
        return 0
    MarginsStart(builder)
    MarginsAddTop(builder, margins.top)
    MarginsAddRight(builder, margins.right)
    MarginsAddBottom(builder, margins.bottom)
    MarginsAddLeft(builder, margins.left)
    return MarginsEnd(builder)

from ducpy.classes.ElementsClass import DucView as DS_DucView
def serialize_fbs_duc_view(builder: flatbuffers.Builder, view: Optional["DS_DucView"]) -> int:
    if view is None:
        return 0
    center_point_offset = serialize_fbs_duc_point(builder, view.center_point)
    scope_offset = builder.CreateString(view.scope)
    DucViewStart(builder)
    DucViewAddScrollX(builder, view.scroll_x)
    DucViewAddScrollY(builder, view.scroll_y)
    DucViewAddZoom(builder, view.zoom)
    DucViewAddTwistAngle(builder, view.twist_angle)
    DucViewAddCenterPoint(builder, center_point_offset)
    DucViewAddScope(builder, scope_offset)
    return DucViewEnd(builder)

# =============================================================================
# Styling & content
# =============================================================================

def serialize_fbs_tiling_properties(builder: flatbuffers.Builder, props: Optional["DS_TilingProperties"]) -> int:
    if props is None:
        return 0
    TilingPropertiesStart(builder)
    TilingPropertiesAddSizeInPercent(builder, props.size_in_percent)
    TilingPropertiesAddAngle(builder, props.angle)
    if props.spacing is not None: TilingPropertiesAddSpacing(builder, props.spacing)
    if props.offset_x is not None: TilingPropertiesAddOffsetX(builder, props.offset_x)
    if props.offset_y is not None: TilingPropertiesAddOffsetY(builder, props.offset_y)
    return TilingPropertiesEnd(builder)

def serialize_fbs_hatch_pattern_line(builder: flatbuffers.Builder, line: "DS_HatchPatternLine") -> int:
    origin_offset = serialize_fbs_duc_point(builder, line.origin)

    offset_vec = 0
    if line.offset:
        HatchPatternLineStartOffsetVector(builder, len(line.offset))
        for v in reversed(line.offset):
            builder.PrependFloat64(v)
        offset_vec = builder.EndVector()

    dash_vec = 0
    if line.dash_pattern:
        HatchPatternLineStartDashPatternVector(builder, len(line.dash_pattern))
        for v in reversed(line.dash_pattern):
            builder.PrependFloat64(v)
        dash_vec = builder.EndVector()

    HatchPatternLineStart(builder)
    HatchPatternLineAddAngle(builder, line.angle)
    HatchPatternLineAddOrigin(builder, origin_offset)
    if offset_vec: HatchPatternLineAddOffset(builder, offset_vec)
    if dash_vec: HatchPatternLineAddDashPattern(builder, dash_vec)
    return HatchPatternLineEnd(builder)

def serialize_fbs_custom_hatch_pattern(builder: flatbuffers.Builder, pattern: Optional["DS_CustomHatchPattern"]) -> int:
    if pattern is None:
        return 0
    name_offset = builder.CreateString(pattern.name)
    description_offset = builder.CreateString(pattern.description)
    lines_offsets = [serialize_fbs_hatch_pattern_line(builder, ln) for ln in (pattern.lines or [])]
    CustomHatchPatternStartLinesVector(builder, len(lines_offsets))
    for off in reversed(lines_offsets):
        builder.PrependUOffsetTRelative(off)
    lines_vec = builder.EndVector()

    CustomHatchPatternStart(builder)
    CustomHatchPatternAddName(builder, name_offset)
    CustomHatchPatternAddDescription(builder, description_offset)
    CustomHatchPatternAddLines(builder, lines_vec)
    return CustomHatchPatternEnd(builder)

def serialize_fbs_duc_hatch_style(builder: flatbuffers.Builder, style: Optional["DS_DucHatchStyle"]) -> int:
    if style is None:
        return 0
    from ducpy.classes.ElementsClass import DucHatchStyle as DS_DucHatchStyle  # Import locally to avoid circular imports
    pattern_name_offset = builder.CreateString(style.pattern_name)
    pattern_origin_offset = serialize_fbs_duc_point(builder, style.pattern_origin)
    custom_pattern_offset = serialize_fbs_custom_hatch_pattern(builder, style.custom_pattern)
    DucHatchStyleStart(builder)
    if style.hatch_style is not None:
        DucHatchStyleAddHatchStyle(builder, style.hatch_style)
    DucHatchStyleAddPatternName(builder, pattern_name_offset)
    DucHatchStyleAddPatternScale(builder, style.pattern_scale)
    DucHatchStyleAddPatternAngle(builder, style.pattern_angle)
    DucHatchStyleAddPatternOrigin(builder, pattern_origin_offset)
    DucHatchStyleAddPatternDouble(builder, style.pattern_double)
    if custom_pattern_offset:
        DucHatchStyleAddCustomPattern(builder, custom_pattern_offset)
    return DucHatchStyleEnd(builder)

def serialize_fbs_duc_image_filter(builder: flatbuffers.Builder, image_filter: Optional["DS_DucImageFilter"]) -> int:
    if image_filter is None:
        return 0
    DucImageFilterStart(builder)
    DucImageFilterAddBrightness(builder, image_filter.brightness)
    DucImageFilterAddContrast(builder, image_filter.contrast)
    return DucImageFilterEnd(builder)

def serialize_fbs_element_content_base(builder: flatbuffers.Builder, content: DS_ElementContentBase) -> int:
    src_offset = builder.CreateString(content.src)
    tiling_offset = serialize_fbs_tiling_properties(builder, content.tiling)
    hatch_offset = serialize_fbs_duc_hatch_style(builder, content.hatch)
    image_filter_offset = serialize_fbs_duc_image_filter(builder, content.image_filter)
    ElementContentBaseStart(builder)
    if content.preference is not None:
        ElementContentBaseAddPreference(builder, content.preference)
    ElementContentBaseAddSrc(builder, src_offset)
    ElementContentBaseAddVisible(builder, content.visible)
    ElementContentBaseAddOpacity(builder, content.opacity)
    if tiling_offset: ElementContentBaseAddTiling(builder, tiling_offset)
    if hatch_offset: ElementContentBaseAddHatch(builder, hatch_offset)
    if image_filter_offset: ElementContentBaseAddImageFilter(builder, image_filter_offset)
    return ElementContentBaseEnd(builder)

def serialize_fbs_stroke_style(builder: flatbuffers.Builder, style: DS_StrokeStyle) -> int:
    dash_vec = 0
    if style.dash:
        StrokeStyleStartDashVector(builder, len(style.dash))
        for v in reversed(style.dash):
            builder.PrependFloat64(v)
        dash_vec = builder.EndVector()

    dash_line_override_offset = _str(builder, style.dash_line_override)

    StrokeStyleStart(builder)
    if style.preference is not None:
        StrokeStyleAddPreference(builder, style.preference)
    if style.cap is not None:
        StrokeStyleAddCap(builder, style.cap)
    if style.join is not None:
        StrokeStyleAddJoin(builder, style.join)
    if dash_vec:
        StrokeStyleAddDash(builder, dash_vec)
    if dash_line_override_offset:
        StrokeStyleAddDashLineOverride(builder, dash_line_override_offset)
    if style.dash_cap is not None:
        StrokeStyleAddDashCap(builder, style.dash_cap)
    if style.miter_limit is not None:
        StrokeStyleAddMiterLimit(builder, style.miter_limit)
    return StrokeStyleEnd(builder)

def serialize_fbs_stroke_sides(builder: flatbuffers.Builder, sides: Optional[DS_StrokeSides]) -> int:
    if sides is None:
        return 0
    values_vec = 0
    if sides.values:
        StrokeSidesStartValuesVector(builder, len(sides.values))
        for v in reversed(sides.values):
            builder.PrependFloat64(v)
        values_vec = builder.EndVector()
    StrokeSidesStart(builder)
    if sides.preference is not None:
        StrokeSidesAddPreference(builder, sides.preference)
    if values_vec:
        StrokeSidesAddValues(builder, values_vec)
    return StrokeSidesEnd(builder)

def serialize_fbs_element_stroke(builder: flatbuffers.Builder, stroke: DS_ElementStroke) -> int:
    if isinstance(stroke, list):
        # Handle case where stroke is a list - take first element or create default
        if stroke and len(stroke) > 0:
            stroke_obj = stroke[0]
            content_offset = serialize_fbs_element_content_base(builder, stroke_obj.content)
            style_offset = serialize_fbs_stroke_style(builder, stroke_obj.style)
            sides_offset = serialize_fbs_stroke_sides(builder, stroke_obj.stroke_sides)
        else:
            # Create default content
            default_content = DS_ElementContentBase(
                src="", visible=True, opacity=1.0, tiling=None, hatch=None, image_filter=None, preference=None
            )
            content_offset = serialize_fbs_element_content_base(builder, default_content)
            style_offset = 0
            sides_offset = 0
    else:
        content_offset = serialize_fbs_element_content_base(builder, stroke.content)
        style_offset = serialize_fbs_stroke_style(builder, stroke.style)
        sides_offset = serialize_fbs_stroke_sides(builder, stroke.stroke_sides)
    
    ElementStrokeStart(builder)
    ElementStrokeAddContent(builder, content_offset)
    ElementStrokeAddWidth(builder, stroke.width if not isinstance(stroke, list) else 1.0)
    ElementStrokeAddStyle(builder, style_offset)
    if not isinstance(stroke, list) and stroke.placement is not None:
        ElementStrokeAddPlacement(builder, stroke.placement)
    if sides_offset:
        ElementStrokeAddStrokeSides(builder, sides_offset)
    return ElementStrokeEnd(builder)

def serialize_fbs_element_background(builder: flatbuffers.Builder, background: DS_ElementBackground) -> int:
    if isinstance(background, list):
        # Handle case where background is a list - take first element or create default
        if background and len(background) > 0:
            bg_obj = background[0]
            content_offset = serialize_fbs_element_content_base(builder, bg_obj.content)
        else:
            # Create default content
            default_content = DS_ElementContentBase(
                src="", visible=True, opacity=1.0, tiling=None, hatch=None, image_filter=None, preference=None
            )
            content_offset = serialize_fbs_element_content_base(builder, default_content)
    else:
        content_offset = serialize_fbs_element_content_base(builder, background.content)
    
    ElementBackgroundStart(builder)
    ElementBackgroundAddContent(builder, content_offset)
    return ElementBackgroundEnd(builder)

def serialize_fbs_duc_element_styles_base(builder: flatbuffers.Builder, style: Optional[DS_DucElementStylesBase]) -> int:
    if style is None:
        return 0
    
    # Create vectors with single elements since dataclass has single objects but FlatBuffers table has arrays
    bg_offset = serialize_fbs_element_background(builder, style.background)
    stroke_offset = serialize_fbs_element_stroke(builder, style.stroke)
    
    DucElementStylesBaseStartBackgroundVector(builder, 1)
    builder.PrependUOffsetTRelative(bg_offset)
    bg_vec = builder.EndVector()

    DucElementStylesBaseStartStrokeVector(builder, 1)
    builder.PrependUOffsetTRelative(stroke_offset)
    stroke_vec = builder.EndVector()

    DucElementStylesBaseStart(builder)
    DucElementStylesBaseAddRoundness(builder, style.roundness)
    DucElementStylesBaseAddBackground(builder, bg_vec)
    DucElementStylesBaseAddStroke(builder, stroke_vec)
    DucElementStylesBaseAddOpacity(builder, style.opacity)
    if style.blending is not None:
        DucElementStylesBaseAddBlending(builder, style.blending)
    return DucElementStylesBaseEnd(builder)

# =============================================================================
# Base element & common components
# =============================================================================

def serialize_fbs_bound_element(builder: flatbuffers.Builder, element: DS_BoundElement) -> int:
    id_offset = builder.CreateString(element.id)
    type_offset = builder.CreateString(element.type)
    BoundElementStart(builder)
    BoundElementAddId(builder, id_offset)
    BoundElementAddType(builder, type_offset)
    return BoundElementEnd(builder)

def serialize_fbs_duc_element_base(builder: flatbuffers.Builder, base: DS_DucElementBase) -> int:
    id_offset = builder.CreateString(base.id)
    styles_offset = serialize_fbs_duc_element_styles_base(builder, base.styles)
    scope_offset = builder.CreateString(base.scope)
    label_offset = builder.CreateString(base.label)
    description_offset = _str(builder, base.description)
    index_offset = _str(builder, base.index)
    layer_id_offset = _str(builder, base.layer_id)
    frame_id_offset = _str(builder, base.frame_id)
    link_offset = _str(builder, base.link)

    group_ids_offsets = [builder.CreateString(g) for g in (base.group_ids or [])]
    _DucElementBaseStartGroupIdsVector(builder, len(group_ids_offsets))
    for off in reversed(group_ids_offsets):
        builder.PrependUOffsetTRelative(off)
    group_ids_vec = builder.EndVector()

    region_ids_offsets = [builder.CreateString(r) for r in (base.region_ids or [])]
    _DucElementBaseStartRegionIdsVector(builder, len(region_ids_offsets))
    for off in reversed(region_ids_offsets):
        builder.PrependUOffsetTRelative(off)
    region_ids_vec = builder.EndVector()

    bound_elements_offsets = [serialize_fbs_bound_element(builder, b) for b in (base.bound_elements or [])]
    bound_elements_vec = 0
    if bound_elements_offsets:
        # There is no helper for count here; flatbuffers expects vector as UOffsetTRelative array
        # but generator created helper for this field:
        # It is _DucElementBaseStartBoundElementsVector if generated. If not, we skip if empty.
        _DucElementBaseStartBoundElementsVector(builder, len(bound_elements_offsets))
        for off in reversed(bound_elements_offsets):
            builder.PrependUOffsetTRelative(off)
        bound_elements_vec = builder.EndVector()

    custom_data_offset = 0
    if base.custom_data:
        custom_data_offset = builder.CreateString(json.dumps(base.custom_data))

    _DucElementBaseStart(builder)
    _DucElementBaseAddId(builder, id_offset)
    _DucElementBaseAddStyles(builder, styles_offset)
    _DucElementBaseAddX(builder, base.x)
    _DucElementBaseAddY(builder, base.y)
    _DucElementBaseAddWidth(builder, base.width)
    _DucElementBaseAddHeight(builder, base.height)
    _DucElementBaseAddAngle(builder, base.angle)
    _DucElementBaseAddScope(builder, scope_offset)
    _DucElementBaseAddLabel(builder, label_offset)
    if description_offset: _DucElementBaseAddDescription(builder, description_offset)
    _DucElementBaseAddIsVisible(builder, base.is_visible)
    _DucElementBaseAddSeed(builder, base.seed)
    _DucElementBaseAddVersion(builder, base.version)
    _DucElementBaseAddVersionNonce(builder, base.version_nonce)
    _DucElementBaseAddUpdated(builder, base.updated)
    if index_offset: _DucElementBaseAddIndex(builder, index_offset)
    _DucElementBaseAddIsPlot(builder, base.is_plot)
    _DucElementBaseAddIsAnnotative(builder, base.is_annotative)
    _DucElementBaseAddIsDeleted(builder, base.is_deleted)
    _DucElementBaseAddGroupIds(builder, group_ids_vec)
    _DucElementBaseAddRegionIds(builder, region_ids_vec)
    if layer_id_offset: _DucElementBaseAddLayerId(builder, layer_id_offset)
    if frame_id_offset: _DucElementBaseAddFrameId(builder, frame_id_offset)
    if bound_elements_vec: _DucElementBaseAddBoundElements(builder, bound_elements_vec)
    _DucElementBaseAddZIndex(builder, base.z_index)
    if link_offset: _DucElementBaseAddLink(builder, link_offset)
    _DucElementBaseAddLocked(builder, base.locked)
    if custom_data_offset: _DucElementBaseAddCustomData(builder, custom_data_offset)
    return _DucElementBaseEnd(builder)

def serialize_fbs_duc_head(builder: flatbuffers.Builder, head: Optional[DS_DucHead]) -> int:
    if not head:
        return 0
    
    block_id_offset = builder.CreateString(head.block_id)

    DucHeadStart(builder)
    DucHeadAddType(builder, head.type)
    DucHeadAddBlockId(builder, block_id_offset)
    DucHeadAddSize(builder, head.size)
    return DucHeadEnd(builder)

def serialize_fbs_point_binding_point(builder: flatbuffers.Builder, pbp: Optional[DS_PointBindingPoint]) -> int:
    if not pbp:
        return 0

    PointBindingPointStart(builder)
    PointBindingPointAddIndex(builder, pbp.index)
    PointBindingPointAddOffset(builder, pbp.offset)
    return PointBindingPointEnd(builder)

def serialize_fbs_duc_point_binding(builder: flatbuffers.Builder, binding: Optional[DS_DucPointBinding]) -> int:
    if not binding:
        return 0

    element_id_offset = builder.CreateString(binding.element_id)
    fixed_point_offset = serialize_fbs_duc_point(builder, binding.fixed_point)
    point_offset = serialize_fbs_point_binding_point(builder, binding.point)
    head_offset = serialize_fbs_duc_head(builder, binding.head)

    DucPointBindingStart(builder)
    DucPointBindingAddElementId(builder, element_id_offset)
    DucPointBindingAddFocus(builder, binding.focus)
    DucPointBindingAddGap(builder, binding.gap)
    if fixed_point_offset: DucPointBindingAddFixedPoint(builder, fixed_point_offset)
    if point_offset: DucPointBindingAddPoint(builder, point_offset)
    if head_offset: DucPointBindingAddHead(builder, head_offset)
    return DucPointBindingEnd(builder)

def serialize_fbs_duc_line_reference(builder: flatbuffers.Builder, ref: DS_DucLineReference) -> int:
    DucLineReferenceStart(builder)
    DucLineReferenceAddIndex(builder, ref.index)
    if ref.handle:
        # Create GeometricPoint struct properly
        from ducpy.Duc.GeometricPoint import CreateGeometricPoint
        handle_struct = CreateGeometricPoint(builder, ref.handle.x, ref.handle.y)
        DucLineReferenceAddHandle(builder, handle_struct)
    return DucLineReferenceEnd(builder)

def serialize_fbs_duc_line(builder: flatbuffers.Builder, line: DS_DucLine) -> int:
    start_offset = serialize_fbs_duc_line_reference(builder, line.start)
    end_offset = serialize_fbs_duc_line_reference(builder, line.end)
    DucLineStart(builder)
    DucLineAddStart(builder, start_offset)
    DucLineAddEnd(builder, end_offset)
    return DucLineEnd(builder)

def serialize_fbs_duc_path(builder: flatbuffers.Builder, path: DS_DucPath) -> int:
    line_idx_vec = 0
    if path.line_indices:
        DucPathStartLineIndicesVector(builder, len(path.line_indices))
        for i in reversed(path.line_indices):
            builder.PrependInt32(i)
        line_idx_vec = builder.EndVector()
    background_offset = serialize_fbs_element_background(builder, path.background) if path.background else 0
    stroke_offset = serialize_fbs_element_stroke(builder, path.stroke) if path.stroke else 0
    DucPathStart(builder)
    if line_idx_vec: DucPathAddLineIndices(builder, line_idx_vec)
    if background_offset: DucPathAddBackground(builder, background_offset)
    if stroke_offset: DucPathAddStroke(builder, stroke_offset)
    return DucPathEnd(builder)

def serialize_fbs_duc_linear_element_base(builder: flatbuffers.Builder, linear_base: DS_DucLinearElementBase) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, linear_base.base)
    points_offsets = [serialize_fbs_duc_point(builder, p) for p in (linear_base.points or [])]
    DucLinearElementBaseStartPointsVector(builder, len(points_offsets))
    for off in reversed(points_offsets):
        builder.PrependUOffsetTRelative(off)
    points_vec = builder.EndVector()

    lines_offsets = [serialize_fbs_duc_line(builder, ln) for ln in (linear_base.lines or [])]
    DucLinearElementBaseStartLinesVector(builder, len(lines_offsets))
    for off in reversed(lines_offsets):
        builder.PrependUOffsetTRelative(off)
    lines_vec = builder.EndVector()

    path_overrides_offsets = [serialize_fbs_duc_path(builder, p) for p in (linear_base.path_overrides or [])]
    DucLinearElementBaseStartPathOverridesVector(builder, len(path_overrides_offsets))
    for off in reversed(path_overrides_offsets):
        builder.PrependUOffsetTRelative(off)
    path_overrides_vec = builder.EndVector()

    last_point_offset = serialize_fbs_duc_point(builder, linear_base.last_committed_point)
    start_binding_offset = serialize_fbs_duc_point_binding(builder, linear_base.start_binding)
    end_binding_offset = serialize_fbs_duc_point_binding(builder, linear_base.end_binding)

    DucLinearElementBaseStart(builder)
    DucLinearElementBaseAddBase(builder, base_offset)
    DucLinearElementBaseAddPoints(builder, points_vec)
    DucLinearElementBaseAddLines(builder, lines_vec)
    DucLinearElementBaseAddPathOverrides(builder, path_overrides_vec)
    if last_point_offset: DucLinearElementBaseAddLastCommittedPoint(builder, last_point_offset)
    if start_binding_offset: DucLinearElementBaseAddStartBinding(builder, start_binding_offset)
    if end_binding_offset: DucLinearElementBaseAddEndBinding(builder, end_binding_offset)
    return DucLinearElementBaseEnd(builder)

def serialize_fbs_duc_stack_like_styles(builder: flatbuffers.Builder, styles: DS_DucStackLikeStyles) -> int:
    labeling_color_offset = builder.CreateString(styles.labeling_color)
    DucStackLikeStylesStart(builder)
    DucStackLikeStylesAddOpacity(builder, styles.opacity)
    DucStackLikeStylesAddLabelingColor(builder, labeling_color_offset)
    return DucStackLikeStylesEnd(builder)

def serialize_fbs_duc_stack_base(builder: flatbuffers.Builder, stack_base: DS_DucStackBase) -> int:
    label_offset = builder.CreateString(stack_base.label)
    description_offset = builder.CreateString(stack_base.description)
    styles_offset = serialize_fbs_duc_stack_like_styles(builder, stack_base.styles)
    _DucStackBaseStart(builder)
    _DucStackBaseAddLabel(builder, label_offset)
    _DucStackBaseAddDescription(builder, description_offset)
    _DucStackBaseAddIsCollapsed(builder, stack_base.is_collapsed)
    _DucStackBaseAddIsPlot(builder, stack_base.is_plot)
    _DucStackBaseAddIsVisible(builder, stack_base.is_visible)
    _DucStackBaseAddLocked(builder, stack_base.locked)
    _DucStackBaseAddStyles(builder, styles_offset)
    return _DucStackBaseEnd(builder)

def serialize_fbs_duc_stack_element_base(builder: flatbuffers.Builder, seb: DS_DucStackElementBase) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, seb.base)
    stack_base_offset = serialize_fbs_duc_stack_base(builder, seb.stack_base)
    standard_override_offset = _str(builder, seb.standard_override)
    DucStackElementBaseStart(builder)
    DucStackElementBaseAddBase(builder, base_offset)
    DucStackElementBaseAddStackBase(builder, stack_base_offset)
    DucStackElementBaseAddClip(builder, seb.clip)
    DucStackElementBaseAddLabelVisible(builder, seb.label_visible)
    if standard_override_offset:
        DucStackElementBaseAddStandardOverride(builder, standard_override_offset)
    return DucStackElementBaseEnd(builder)

# =============================================================================
# Element-specific style serializers
# =============================================================================

def serialize_fbs_line_spacing(builder: flatbuffers.Builder, ls: Optional[DS_LineSpacing]) -> int:
    if ls is None:
        return 0
    LineSpacingStart(builder)
    LineSpacingAddValue(builder, ls.value)
    if ls.type is not None:
        LineSpacingAddType(builder, ls.type)
    return LineSpacingEnd(builder)

def serialize_fbs_duc_text_style(builder: flatbuffers.Builder, style: DS_DucTextStyle) -> int:
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, style.base_style)
    font_family_offset = builder.CreateString(style.font_family)
    big_font_family_offset = builder.CreateString(style.big_font_family)
    line_spacing_offset = serialize_fbs_line_spacing(builder, style.line_spacing)
    DucTextStyleStart(builder)
    DucTextStyleAddBaseStyle(builder, base_style_offset)
    DucTextStyleAddIsLtr(builder, style.is_ltr)
    DucTextStyleAddFontFamily(builder, font_family_offset)
    DucTextStyleAddBigFontFamily(builder, big_font_family_offset)
    if style.text_align is not None:
        DucTextStyleAddTextAlign(builder, style.text_align)
    if style.vertical_align is not None:
        DucTextStyleAddVerticalAlign(builder, style.vertical_align)
    DucTextStyleAddLineHeight(builder, style.line_height)
    DucTextStyleAddLineSpacing(builder, line_spacing_offset)
    DucTextStyleAddObliqueAngle(builder, style.oblique_angle)
    DucTextStyleAddFontSize(builder, style.font_size)
    if style.paper_text_height is not None:
        DucTextStyleAddPaperTextHeight(builder, style.paper_text_height)
    DucTextStyleAddWidthFactor(builder, style.width_factor)
    DucTextStyleAddIsUpsideDown(builder, style.is_upside_down)
    DucTextStyleAddIsBackwards(builder, style.is_backwards)
    return DucTextStyleEnd(builder)

def serialize_fbs_table_cell_style(builder: flatbuffers.Builder, style: DS_DucTableCellStyle) -> int:
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, style.base_style)
    text_style_offset = serialize_fbs_duc_text_style(builder, style.text_style)
    margins_offset = serialize_fbs_margins(builder, style.margins)
    DucTableCellStyleStart(builder)
    DucTableCellStyleAddBaseStyle(builder, base_style_offset)
    DucTableCellStyleAddTextStyle(builder, text_style_offset)
    DucTableCellStyleAddMargins(builder, margins_offset)
    if style.alignment is not None:
        DucTableCellStyleAddAlignment(builder, style.alignment)
    return DucTableCellStyleEnd(builder)

def serialize_fbs_table_style(builder: flatbuffers.Builder, style: Optional[DS_DucTableStyle]) -> int:
    if style is None:
        return 0
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, style.base_style) if style.base_style else 0
    header_row_style_offset = serialize_fbs_table_cell_style(builder, style.header_row_style)
    data_row_style_offset = serialize_fbs_table_cell_style(builder, style.data_row_style)
    data_column_style_offset = serialize_fbs_table_cell_style(builder, style.data_column_style)
    flow_direction = style.flow_direction if style.flow_direction is not None else TABLE_FLOW_DIRECTION.VERTICAL
    DucTableStyleStart(builder)
    DucTableStyleAddBaseStyle(builder, base_style_offset)
    DucTableStyleAddHeaderRowStyle(builder, header_row_style_offset)
    DucTableStyleAddDataRowStyle(builder, data_row_style_offset)
    DucTableStyleAddDataColumnStyle(builder, data_column_style_offset)
    DucTableStyleAddFlowDirection(builder, flow_direction)
    return DucTableStyleEnd(builder)

def serialize_fbs_leader_style(builder: flatbuffers.Builder, style: DS_DucLeaderStyle) -> int:
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, style.base_style)
    text_style_offset = serialize_fbs_duc_text_style(builder, style.text_style)
    heads_offsets = [serialize_fbs_duc_head(builder, h) for h in (style.heads_override or [])]
    heads_vec = 0
    if heads_offsets:
        DucLeaderStyleStartHeadsOverrideVector(builder, len(heads_offsets))
        for off in reversed(heads_offsets):
            builder.PrependUOffsetTRelative(off)
        heads_vec = builder.EndVector()
    DucLeaderStyleStart(builder)
    DucLeaderStyleAddBaseStyle(builder, base_style_offset)
    if heads_vec:
        DucLeaderStyleAddHeadsOverride(builder, heads_vec)
    if style.dogleg is not None:
        DucLeaderStyleAddDogleg(builder, style.dogleg)
    DucLeaderStyleAddTextStyle(builder, text_style_offset)
    if style.text_attachment is not None:
        DucLeaderStyleAddTextAttachment(builder, style.text_attachment)
    if style.block_attachment is not None:
        DucLeaderStyleAddBlockAttachment(builder, style.block_attachment)
    return DucLeaderStyleEnd(builder)

def serialize_fbs_dimension_tolerance_style(builder: flatbuffers.Builder, t: Optional[DS_DimensionToleranceStyle]) -> int:
    if t is None:
        return 0
    text_style_offset = serialize_fbs_duc_text_style(builder, t.text_style) if t.text_style else 0
    DimensionToleranceStyleStart(builder)
    DimensionToleranceStyleAddEnabled(builder, t.enabled)
    if t.display_method is not None:
        DimensionToleranceStyleAddDisplayMethod(builder, t.display_method)
    DimensionToleranceStyleAddUpperValue(builder, t.upper_value)
    DimensionToleranceStyleAddLowerValue(builder, t.lower_value)
    DimensionToleranceStyleAddPrecision(builder, t.precision)
    if text_style_offset:
        DimensionToleranceStyleAddTextStyle(builder, text_style_offset)
    return DimensionToleranceStyleEnd(builder)

def serialize_fbs_dimension_fit_style(builder: flatbuffers.Builder, f: DS_DimensionFitStyle) -> int:
    DimensionFitStyleStart(builder)
    if f.rule is not None:
        DimensionFitStyleAddRule(builder, f.rule)
    if f.text_placement is not None:
        DimensionFitStyleAddTextPlacement(builder, f.text_placement)
    DimensionFitStyleAddForceTextInside(builder, f.force_text_inside)
    return DimensionFitStyleEnd(builder)

def serialize_fbs_dimension_line_style(builder: flatbuffers.Builder, s: DS_DimensionLineStyle) -> int:
    stroke_offset = serialize_fbs_element_stroke(builder, s.stroke)
    DimensionLineStyleStart(builder)
    DimensionLineStyleAddStroke(builder, stroke_offset)
    DimensionLineStyleAddTextGap(builder, s.text_gap)
    return DimensionLineStyleEnd(builder)

def serialize_fbs_dimension_ext_line_style(builder: flatbuffers.Builder, s: DS_DimensionExtLineStyle) -> int:
    stroke_offset = serialize_fbs_element_stroke(builder, s.stroke)
    DimensionExtLineStyleStart(builder)
    DimensionExtLineStyleAddStroke(builder, stroke_offset)
    DimensionExtLineStyleAddOvershoot(builder, s.overshoot)
    DimensionExtLineStyleAddOffset(builder, s.offset)
    return DimensionExtLineStyleEnd(builder)

def serialize_fbs_dimension_symbol_style(builder: flatbuffers.Builder, s: DS_DimensionSymbolStyle) -> int:
    heads_offsets = [serialize_fbs_duc_head(builder, h) for h in (s.heads_override or [])]
    heads_vec = 0
    if heads_offsets:
        DimensionSymbolStyleStartHeadsOverrideVector(builder, len(heads_offsets))
        for off in reversed(heads_offsets):
            builder.PrependUOffsetTRelative(off)
        heads_vec = builder.EndVector()
    DimensionSymbolStyleStart(builder)
    if heads_vec:
        DimensionSymbolStyleAddHeadsOverride(builder, heads_vec)
    if s.center_mark_type is not None:
        DimensionSymbolStyleAddCenterMarkType(builder, s.center_mark_type)
    DimensionSymbolStyleAddCenterMarkSize(builder, s.center_mark_size)
    return DimensionSymbolStyleEnd(builder)

def serialize_fbs_dimension_style(builder: flatbuffers.Builder, s: DS_DucDimensionStyle) -> int:
    dim_line_offset = serialize_fbs_dimension_line_style(builder, s.dim_line)
    ext_line_offset = serialize_fbs_dimension_ext_line_style(builder, s.ext_line)
    text_style_offset = serialize_fbs_duc_text_style(builder, s.text_style)
    symbols_offset = serialize_fbs_dimension_symbol_style(builder, s.symbols)
    tolerance_offset = serialize_fbs_dimension_tolerance_style(builder, s.tolerance)
    fit_offset = serialize_fbs_dimension_fit_style(builder, s.fit)
    DucDimensionStyleStart(builder)
    DucDimensionStyleAddDimLine(builder, dim_line_offset)
    DucDimensionStyleAddExtLine(builder, ext_line_offset)
    DucDimensionStyleAddTextStyle(builder, text_style_offset)
    DucDimensionStyleAddSymbols(builder, symbols_offset)
    DucDimensionStyleAddTolerance(builder, tolerance_offset)
    DucDimensionStyleAddFit(builder, fit_offset)
    return DucDimensionStyleEnd(builder)

def serialize_fbs_fcf_layout_style(builder: flatbuffers.Builder, s: DS_FCFLayoutStyle) -> int:
    FCFLayoutStyleStart(builder)
    FCFLayoutStyleAddPadding(builder, s.padding)
    FCFLayoutStyleAddSegmentSpacing(builder, s.segment_spacing)
    FCFLayoutStyleAddRowSpacing(builder, s.row_spacing)
    return FCFLayoutStyleEnd(builder)

def serialize_fbs_fcf_symbol_style(builder: flatbuffers.Builder, s: DS_FCFSymbolStyle) -> int:
    FCFSymbolStyleStart(builder)
    FCFSymbolStyleAddScale(builder, s.scale)
    return FCFSymbolStyleEnd(builder)

def serialize_fbs_fcf_datum_style(builder: flatbuffers.Builder, s: DS_FCFDatumStyle) -> int:
    FCFDatumStyleStart(builder)
    if s.bracket_style is not None:
        FCFDatumStyleAddBracketStyle(builder, s.bracket_style)
    return FCFDatumStyleEnd(builder)

def serialize_fbs_feature_control_frame_style(builder: flatbuffers.Builder, s: DS_DucFeatureControlFrameStyle) -> int:
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, s.base_style)
    text_style_offset = serialize_fbs_duc_text_style(builder, s.text_style)
    layout_offset = serialize_fbs_fcf_layout_style(builder, s.layout)
    symbols_offset = serialize_fbs_fcf_symbol_style(builder, s.symbols)
    datum_offset = serialize_fbs_fcf_datum_style(builder, s.datum_style)
    DucFeatureControlFrameStyleStart(builder)
    DucFeatureControlFrameStyleAddBaseStyle(builder, base_style_offset)
    DucFeatureControlFrameStyleAddTextStyle(builder, text_style_offset)
    DucFeatureControlFrameStyleAddLayout(builder, layout_offset)
    DucFeatureControlFrameStyleAddSymbols(builder, symbols_offset)
    DucFeatureControlFrameStyleAddDatumStyle(builder, datum_offset)
    return DucFeatureControlFrameStyleEnd(builder)

def serialize_fbs_paragraph_formatting(builder: flatbuffers.Builder, p: DS_ParagraphFormatting) -> int:
    tab_vec = 0
    if p.tab_stops:
        ParagraphFormattingStartTabStopsVector(builder, len(p.tab_stops))
        for v in reversed(p.tab_stops):
            builder.PrependFloat64(v)
        tab_vec = builder.EndVector()
    ParagraphFormattingStart(builder)
    ParagraphFormattingAddFirstLineIndent(builder, p.first_line_indent)
    ParagraphFormattingAddHangingIndent(builder, p.hanging_indent)
    ParagraphFormattingAddLeftIndent(builder, p.left_indent)
    ParagraphFormattingAddRightIndent(builder, p.right_indent)
    ParagraphFormattingAddSpaceBefore(builder, p.space_before)
    ParagraphFormattingAddSpaceAfter(builder, p.space_after)
    if tab_vec:
        ParagraphFormattingAddTabStops(builder, tab_vec)
    return ParagraphFormattingEnd(builder)

def serialize_fbs_stack_format_properties(builder: flatbuffers.Builder, p: DS_StackFormatProperties) -> int:
    StackFormatPropertiesStart(builder)
    StackFormatPropertiesAddUpperScale(builder, p.upper_scale)
    StackFormatPropertiesAddLowerScale(builder, p.lower_scale)
    if p.alignment is not None:
        StackFormatPropertiesAddAlignment(builder, p.alignment)
    return StackFormatPropertiesEnd(builder)

def serialize_fbs_stack_format(builder: flatbuffers.Builder, s: DS_StackFormat) -> int:
    chars_vec = 0
    if s.stack_chars:
        # Create all strings first before starting the vector
        char_offsets = [builder.CreateString(ch) for ch in s.stack_chars]
        StackFormatStartStackCharsVector(builder, len(char_offsets))
        for off in reversed(char_offsets):
            builder.PrependUOffsetTRelative(off)
        chars_vec = builder.EndVector()
    props_offset = serialize_fbs_stack_format_properties(builder, s.properties)
    StackFormatStart(builder)
    StackFormatAddAutoStack(builder, s.auto_stack)
    if chars_vec:
        StackFormatAddStackChars(builder, chars_vec)
    StackFormatAddProperties(builder, props_offset)
    return StackFormatEnd(builder)

def serialize_fbs_doc_style(builder: flatbuffers.Builder, s: DS_DucDocStyle) -> int:
    text_style_offset = serialize_fbs_duc_text_style(builder, s.text_style)
    paragraph_offset = serialize_fbs_paragraph_formatting(builder, s.paragraph)
    stack_format_offset = serialize_fbs_stack_format(builder, s.stack_format)
    DucDocStyleStart(builder)
    DucDocStyleAddTextStyle(builder, text_style_offset)
    DucDocStyleAddParagraph(builder, paragraph_offset)
    DucDocStyleAddStackFormat(builder, stack_format_offset)
    return DucDocStyleEnd(builder)

def serialize_fbs_viewport_style(builder: flatbuffers.Builder, s: DS_DucViewportStyle) -> int:
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, s.base_style)
    DucViewportStyleStart(builder)
    DucViewportStyleAddBaseStyle(builder, base_style_offset)
    DucViewportStyleAddScaleIndicatorVisible(builder, s.scale_indicator_visible)
    return DucViewportStyleEnd(builder)

def serialize_fbs_plot_style(builder: flatbuffers.Builder, s: DS_DucPlotStyle) -> int:
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, s.base_style)
    DucPlotStyleStart(builder)
    DucPlotStyleAddBaseStyle(builder, base_style_offset)
    return DucPlotStyleEnd(builder)

def serialize_fbs_xray_style(builder: flatbuffers.Builder, s: DS_DucXRayStyle) -> int:
    base_style_offset = serialize_fbs_duc_element_styles_base(builder, s.base_style)
    color_offset = builder.CreateString(s.color)
    DucXRayStyleStart(builder)
    DucXRayStyleAddBaseStyle(builder, base_style_offset)
    DucXRayStyleAddColor(builder, color_offset)
    return DucXRayStyleEnd(builder)

# =============================================================================
# Element definitions
# =============================================================================

def serialize_fbs_rectangle(builder: flatbuffers.Builder, el: DS_DucRectangleElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    DucRectangleElementStart(builder)
    DucRectangleElementAddBase(builder, base_offset)
    return DucRectangleElementEnd(builder)

def serialize_fbs_polygon(builder: flatbuffers.Builder, el: DS_DucPolygonElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    DucPolygonElementStart(builder)
    DucPolygonElementAddBase(builder, base_offset)
    DucPolygonElementAddSides(builder, el.sides)
    return DucPolygonElementEnd(builder)

def serialize_fbs_ellipse(builder: flatbuffers.Builder, el: DS_DucEllipseElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    DucEllipseElementStart(builder)
    DucEllipseElementAddBase(builder, base_offset)
    DucEllipseElementAddRatio(builder, el.ratio)
    DucEllipseElementAddStartAngle(builder, el.start_angle)
    DucEllipseElementAddEndAngle(builder, el.end_angle)
    DucEllipseElementAddShowAuxCrosshair(builder, el.show_aux_crosshair)
    return DucEllipseElementEnd(builder)

def serialize_fbs_embeddable(builder: flatbuffers.Builder, el: DS_DucEmbeddableElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    DucEmbeddableElementStart(builder)
    DucEmbeddableElementAddBase(builder, base_offset)
    return DucEmbeddableElementEnd(builder)

def serialize_fbs_pdf(builder: flatbuffers.Builder, el: DS_DucPdfElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    file_id_offset = _str(builder, el.file_id)
    DucPdfElementStart(builder)
    DucPdfElementAddBase(builder, base_offset)
    if file_id_offset:
        DucPdfElementAddFileId(builder, file_id_offset)
    return DucPdfElementEnd(builder)

def serialize_fbs_mermaid(builder: flatbuffers.Builder, el: DS_DucMermaidElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    source_offset = builder.CreateString(el.source)
    theme_offset = _str(builder, el.theme)
    svg_offset = _str(builder, el.svg_path)
    DucMermaidElementStart(builder)
    DucMermaidElementAddBase(builder, base_offset)
    DucMermaidElementAddSource(builder, source_offset)
    if theme_offset:
        DucMermaidElementAddTheme(builder, theme_offset)
    if svg_offset:
        DucMermaidElementAddSvgPath(builder, svg_offset)
    return DucMermaidElementEnd(builder)

def serialize_fbs_table_column(builder: flatbuffers.Builder, col: DS_DucTableColumn) -> int:
    id_offset = builder.CreateString(col.id)
    style_overrides_offset = serialize_fbs_table_cell_style(builder, col.style_overrides) if col.style_overrides else 0
    DucTableColumnStart(builder)
    DucTableColumnAddId(builder, id_offset)
    DucTableColumnAddWidth(builder, col.width)
    if style_overrides_offset:
        DucTableColumnAddStyleOverrides(builder, style_overrides_offset)
    return DucTableColumnEnd(builder)

def serialize_fbs_table_row(builder: flatbuffers.Builder, row: DS_DucTableRow) -> int:
    id_offset = builder.CreateString(row.id)
    style_overrides_offset = serialize_fbs_table_cell_style(builder, row.style_overrides) if row.style_overrides else 0
    DucTableRowStart(builder)
    DucTableRowAddId(builder, id_offset)
    DucTableRowAddHeight(builder, row.height)
    if style_overrides_offset:
        DucTableRowAddStyleOverrides(builder, style_overrides_offset)
    return DucTableRowEnd(builder)

def serialize_fbs_table_cell_span(builder: flatbuffers.Builder, span: Optional[DS_DucTableCellSpan]) -> int:
    if span is None:
        return 0
    DucTableCellSpanStart(builder)
    DucTableCellSpanAddColumns(builder, span.columns)
    DucTableCellSpanAddRows(builder, span.rows)
    return DucTableCellSpanEnd(builder)

def serialize_fbs_table_cell(builder: flatbuffers.Builder, cell: DS_DucTableCell) -> int:
    row_id_offset = builder.CreateString(cell.row_id)
    column_id_offset = builder.CreateString(cell.column_id)
    data_offset = builder.CreateString(cell.data)
    span_offset = serialize_fbs_table_cell_span(builder, cell.span)
    style_overrides_offset = serialize_fbs_table_cell_style(builder, cell.style_overrides) if cell.style_overrides else 0
    DucTableCellStart(builder)
    DucTableCellAddRowId(builder, row_id_offset)
    DucTableCellAddColumnId(builder, column_id_offset)
    DucTableCellAddData(builder, data_offset)
    if span_offset: DucTableCellAddSpan(builder, span_offset)
    DucTableCellAddLocked(builder, cell.locked)
    if style_overrides_offset: DucTableCellAddStyleOverrides(builder, style_overrides_offset)
    return DucTableCellEnd(builder)

def serialize_fbs_table_column_entry(builder: flatbuffers.Builder, entry: DS_DucTableColumnEntry) -> int:
    key_offset = builder.CreateString(entry.key)
    value_offset = serialize_fbs_table_column(builder, entry.value)
    DucTableColumnEntryStart(builder)
    DucTableColumnEntryAddKey(builder, key_offset)
    DucTableColumnEntryAddValue(builder, value_offset)
    return DucTableColumnEntryEnd(builder)

def serialize_fbs_table_row_entry(builder: flatbuffers.Builder, entry: DS_DucTableRowEntry) -> int:
    key_offset = builder.CreateString(entry.key)
    value_offset = serialize_fbs_table_row(builder, entry.value)
    DucTableRowEntryStart(builder)
    DucTableRowEntryAddKey(builder, key_offset)
    DucTableRowEntryAddValue(builder, value_offset)
    return DucTableRowEntryEnd(builder)

def serialize_fbs_table_cell_entry(builder: flatbuffers.Builder, entry: DS_DucTableCellEntry) -> int:
    key_offset = builder.CreateString(entry.key)
    value_offset = serialize_fbs_table_cell(builder, entry.value)
    DucTableCellEntryStart(builder)
    DucTableCellEntryAddKey(builder, key_offset)
    DucTableCellEntryAddValue(builder, value_offset)
    return DucTableCellEntryEnd(builder)

def serialize_fbs_table_auto_size(builder: flatbuffers.Builder, a: DS_DucTableAutoSize) -> int:
    DucTableAutoSizeStart(builder)
    DucTableAutoSizeAddColumns(builder, a.columns)
    DucTableAutoSizeAddRows(builder, a.rows)
    return DucTableAutoSizeEnd(builder)

def serialize_fbs_table(builder: flatbuffers.Builder, el: DS_DucTableElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    style_offset = serialize_fbs_table_style(builder, el.style)

    col_order_offsets = [builder.CreateString(x) for x in (el.column_order or [])]
    DucTableElementStartColumnOrderVector(builder, len(col_order_offsets))
    for off in reversed(col_order_offsets):
        builder.PrependUOffsetTRelative(off)
    col_order_vec = builder.EndVector()

    row_order_offsets = [builder.CreateString(x) for x in (el.row_order or [])]
    DucTableElementStartRowOrderVector(builder, len(row_order_offsets))
    for off in reversed(row_order_offsets):
        builder.PrependUOffsetTRelative(off)
    row_order_vec = builder.EndVector()

    col_entries_offsets = [serialize_fbs_table_column_entry(builder, c) for c in (el.columns or [])]
    DucTableElementStartColumnsVector(builder, len(col_entries_offsets))
    for off in reversed(col_entries_offsets):
        builder.PrependUOffsetTRelative(off)
    columns_vec = builder.EndVector()

    row_entries_offsets = [serialize_fbs_table_row_entry(builder, r) for r in (el.rows or [])]
    DucTableElementStartRowsVector(builder, len(row_entries_offsets))
    for off in reversed(row_entries_offsets):
        builder.PrependUOffsetTRelative(off)
    rows_vec = builder.EndVector()

    cell_entries_offsets = [serialize_fbs_table_cell_entry(builder, c) for c in (el.cells or [])]
    DucTableElementStartCellsVector(builder, len(cell_entries_offsets))
    for off in reversed(cell_entries_offsets):
        builder.PrependUOffsetTRelative(off)
    cells_vec = builder.EndVector()

    auto_size_offset = serialize_fbs_table_auto_size(builder, el.auto_size)

    DucTableElementStart(builder)
    DucTableElementAddBase(builder, base_offset)
    DucTableElementAddStyle(builder, style_offset)
    DucTableElementAddColumnOrder(builder, col_order_vec)
    DucTableElementAddRowOrder(builder, row_order_vec)
    DucTableElementAddColumns(builder, columns_vec)
    DucTableElementAddRows(builder, rows_vec)
    DucTableElementAddCells(builder, cells_vec)
    DucTableElementAddHeaderRowCount(builder, el.header_row_count)
    DucTableElementAddAutoSize(builder, auto_size_offset)
    return DucTableElementEnd(builder)

def serialize_fbs_image_crop(builder: flatbuffers.Builder, crop: Optional[DS_ImageCrop]) -> int:
    if crop is None:
        return 0
    ImageCropStart(builder)
    ImageCropAddX(builder, crop.x)
    ImageCropAddY(builder, crop.y)
    ImageCropAddWidth(builder, crop.width)
    ImageCropAddHeight(builder, crop.height)
    ImageCropAddNaturalWidth(builder, crop.natural_width)
    ImageCropAddNaturalHeight(builder, crop.natural_height)
    return ImageCropEnd(builder)

def serialize_fbs_image(builder: flatbuffers.Builder, el: DS_DucImageElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    file_id_offset = _str(builder, el.file_id)

    scale_vec = 0
    if el.scale is not None and len(el.scale) > 0:
        DucImageElementStartScaleVector(builder, len(el.scale))
        for v in reversed(el.scale):
            builder.PrependFloat64(v)
        scale_vec = builder.EndVector()

    crop_offset = serialize_fbs_image_crop(builder, el.crop)
    filter_offset = serialize_fbs_duc_image_filter(builder, el.filter)

    DucImageElementStart(builder)
    DucImageElementAddBase(builder, base_offset)
    if file_id_offset: DucImageElementAddFileId(builder, file_id_offset)
    if el.status is not None: DucImageElementAddStatus(builder, el.status)
    if scale_vec: DucImageElementAddScale(builder, scale_vec)
    if crop_offset: DucImageElementAddCrop(builder, crop_offset)
    if filter_offset: DucImageElementAddFilter(builder, filter_offset)
    return DucImageElementEnd(builder)

def serialize_fbs_primary_units(builder: flatbuffers.Builder, pu: Optional["DS_PrimaryUnits"]) -> int:
    # Implemented in Standards section (Part 2/5), but present here to satisfy forward reference
    # We return 0 here and will override the function after definition in Part 2.
    return 0

def serialize_fbs_text_dynamic_source(builder: flatbuffers.Builder, src: DS_DucTextDynamicSource) -> int:
    # Determine type from underlying source value
    source = src.source
    if isinstance(source, DS_DucTextDynamicElementSource):
        typ = FBS_DucTextDynamicSourceData.DucTextDynamicElementSource
        DucTextDynamicElementSourceStart(builder)
        DucTextDynamicElementSourceAddElementId(builder, builder.CreateString(source.element_id))
        DucTextDynamicElementSourceAddProperty(builder, source.property)
        src_offset = DucTextDynamicElementSourceEnd(builder)
        src_type_enum = TEXT_FIELD_SOURCE_TYPE.ELEMENT
    elif isinstance(source, DS_DucTextDynamicDictionarySource):
        typ = FBS_DucTextDynamicSourceData.DucTextDynamicDictionarySource
        DucTextDynamicDictionarySourceStart(builder)
        DucTextDynamicDictionarySourceAddKey(builder, builder.CreateString(source.key))
        src_offset = DucTextDynamicDictionarySourceEnd(builder)
        src_type_enum = TEXT_FIELD_SOURCE_TYPE.DICTIONARY
    else:
        typ = 0
        src_offset = 0
        src_type_enum = 0

    DucTextDynamicSourceStart(builder)
    if src_type_enum:
        DucTextDynamicSourceAddTextSourceType(builder, src_type_enum)
    if typ and src_offset:
        DucTextDynamicSourceAddSourceType(builder, typ)
        DucTextDynamicSourceAddSource(builder, src_offset)
    return DucTextDynamicSourceEnd(builder)

def serialize_fbs_text_dynamic_part(builder: flatbuffers.Builder, part: DS_DucTextDynamicPart) -> int:
    tag_offset = builder.CreateString(part.tag)
    cached_value_offset = builder.CreateString(part.cached_value)
    formatting_offset = serialize_fbs_primary_units(builder, part.formatting) if part.formatting else 0
    src_offset = serialize_fbs_text_dynamic_source(builder, part.source)
    DucTextDynamicPartStart(builder)
    DucTextDynamicPartAddTag(builder, tag_offset)
    DucTextDynamicPartAddSource(builder, src_offset)
    if formatting_offset:
        DucTextDynamicPartAddFormatting(builder, formatting_offset)
    DucTextDynamicPartAddCachedValue(builder, cached_value_offset)
    return DucTextDynamicPartEnd(builder)

def serialize_fbs_text(builder: flatbuffers.Builder, el: DS_DucTextElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    style_offset = serialize_fbs_duc_text_style(builder, el.style)
    text_offset = builder.CreateString(el.text)
    dynamic_offsets = [serialize_fbs_text_dynamic_part(builder, p) for p in (el.dynamic or [])]
    dynamic_vec = 0
    if dynamic_offsets:
        DucTextElementStartDynamicVector(builder, len(dynamic_offsets))
        for off in reversed(dynamic_offsets):
            builder.PrependUOffsetTRelative(off)
        dynamic_vec = builder.EndVector()
    container_id_offset = _str(builder, el.container_id)
    original_text_offset = builder.CreateString(el.original_text)
    DucTextElementStart(builder)
    DucTextElementAddBase(builder, base_offset)
    DucTextElementAddStyle(builder, style_offset)
    DucTextElementAddText(builder, text_offset)
    if dynamic_vec:
        DucTextElementAddDynamic(builder, dynamic_vec)
    DucTextElementAddAutoResize(builder, el.auto_resize)
    if container_id_offset:
        DucTextElementAddContainerId(builder, container_id_offset)
    DucTextElementAddOriginalText(builder, original_text_offset)
    return DucTextElementEnd(builder)

def serialize_fbs_linear(builder: flatbuffers.Builder, el: DS_DucLinearElement) -> int:
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, el.linear_base)
    DucLinearElementStart(builder)
    DucLinearElementAddLinearBase(builder, linear_base_offset)
    DucLinearElementAddWipeoutBelow(builder, el.wipeout_below)
    return DucLinearElementEnd(builder)

def serialize_fbs_arrow(builder: flatbuffers.Builder, el: DS_DucArrowElement) -> int:
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, el.linear_base)
    DucArrowElementStart(builder)
    DucArrowElementAddLinearBase(builder, linear_base_offset)
    DucArrowElementAddElbowed(builder, el.elbowed)
    return DucArrowElementEnd(builder)

def serialize_fbs_freedraw_ends(builder: flatbuffers.Builder, e: Optional[DS_DucFreeDrawEnds]) -> int:
    if e is None:
        return 0
    easing_offset = builder.CreateString(e.easing)
    DucFreeDrawEndsStart(builder)
    DucFreeDrawEndsAddCap(builder, e.cap)
    DucFreeDrawEndsAddTaper(builder, e.taper)
    DucFreeDrawEndsAddEasing(builder, easing_offset)
    return DucFreeDrawEndsEnd(builder)

def serialize_fbs_freedraw(builder: flatbuffers.Builder, el: DS_DucFreeDrawElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    points_offsets = [serialize_fbs_duc_point(builder, p) for p in (el.points or [])]
    DucFreeDrawElementStartPointsVector(builder, len(points_offsets))
    for off in reversed(points_offsets):
        builder.PrependUOffsetTRelative(off)
    points_vec = builder.EndVector()

    pressures_vec = 0
    if el.pressures is not None and len(el.pressures) > 0:
        DucFreeDrawElementStartPressuresVector(builder, len(el.pressures))
        for p in reversed(el.pressures):
            builder.PrependFloat32(p)
        pressures_vec = builder.EndVector()

    last_point_offset = serialize_fbs_duc_point(builder, el.last_committed_point)
    start_offset = serialize_fbs_freedraw_ends(builder, el.start)
    end_offset = serialize_fbs_freedraw_ends(builder, el.end)
    svg_offset = _str(builder, el.svg_path)
    easing_offset = builder.CreateString(el.easing)

    DucFreeDrawElementStart(builder)
    DucFreeDrawElementAddBase(builder, base_offset)
    DucFreeDrawElementAddPoints(builder, points_vec)
    DucFreeDrawElementAddSize(builder, el.size)
    DucFreeDrawElementAddThinning(builder, el.thinning)
    DucFreeDrawElementAddSmoothing(builder, el.smoothing)
    DucFreeDrawElementAddStreamline(builder, el.streamline)
    DucFreeDrawElementAddEasing(builder, easing_offset)
    if start_offset: DucFreeDrawElementAddStart(builder, start_offset)
    if end_offset: DucFreeDrawElementAddEnd(builder, end_offset)
    if pressures_vec: DucFreeDrawElementAddPressures(builder, pressures_vec)
    DucFreeDrawElementAddSimulatePressure(builder, el.simulate_pressure)
    if last_point_offset: DucFreeDrawElementAddLastCommittedPoint(builder, last_point_offset)
    if svg_offset: DucFreeDrawElementAddSvgPath(builder, svg_offset)
    return DucFreeDrawElementEnd(builder)

def serialize_fbs_block_duplication_array(builder: flatbuffers.Builder, d: Optional[DS_DucBlockDuplicationArray]) -> int:
    if d is None:
        return 0
    DucBlockDuplicationArrayStart(builder)
    DucBlockDuplicationArrayAddRows(builder, d.rows)
    DucBlockDuplicationArrayAddCols(builder, d.cols)
    DucBlockDuplicationArrayAddRowSpacing(builder, d.row_spacing)
    DucBlockDuplicationArrayAddColSpacing(builder, d.col_spacing)
    return DucBlockDuplicationArrayEnd(builder)

def serialize_fbs_block_instance(builder: flatbuffers.Builder, el: DS_DucBlockInstanceElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    block_id_offset = builder.CreateString(el.block_id)
    element_overrides_offsets = [serialize_fbs_string_value_entry(builder, o) for o in (el.element_overrides or [])]
    elem_overrides_vec = 0
    if element_overrides_offsets:
        DucBlockInstanceElementStartElementOverridesVector(builder, len(element_overrides_offsets))
        for off in reversed(element_overrides_offsets):
            builder.PrependUOffsetTRelative(off)
        elem_overrides_vec = builder.EndVector()

    attribute_values_offsets = [serialize_fbs_string_value_entry(builder, o) for o in (el.attribute_values or [])]
    attr_values_vec = 0
    if attribute_values_offsets:
        DucBlockInstanceElementStartAttributeValuesVector(builder, len(attribute_values_offsets))
        for off in reversed(attribute_values_offsets):
            builder.PrependUOffsetTRelative(off)
        attr_values_vec = builder.EndVector()

    dup_offset = serialize_fbs_block_duplication_array(builder, el.duplication_array)

    DucBlockInstanceElementStart(builder)
    DucBlockInstanceElementAddBase(builder, base_offset)
    DucBlockInstanceElementAddBlockId(builder, block_id_offset)
    if elem_overrides_vec: DucBlockInstanceElementAddElementOverrides(builder, elem_overrides_vec)
    if attr_values_vec: DucBlockInstanceElementAddAttributeValues(builder, attr_values_vec)
    if dup_offset: DucBlockInstanceElementAddDuplicationArray(builder, dup_offset)
    return DucBlockInstanceElementEnd(builder)

def serialize_fbs_frame(builder: flatbuffers.Builder, el: DS_DucFrameElement) -> int:
    seb_offset = serialize_fbs_duc_stack_element_base(builder, el.stack_element_base)
    DucFrameElementStart(builder)
    DucFrameElementAddStackElementBase(builder, seb_offset)
    return DucFrameElementEnd(builder)

def serialize_fbs_plot(builder: flatbuffers.Builder, el: DS_DucPlotElement) -> int:
    seb_offset = serialize_fbs_duc_stack_element_base(builder, el.stack_element_base)
    style_offset = serialize_fbs_plot_style(builder, el.style)
    margins_offset = serialize_fbs_margins(builder, el.layout.margins)
    PlotLayoutStart(builder)
    PlotLayoutAddMargins(builder, margins_offset)
    layout_offset = PlotLayoutEnd(builder)
    DucPlotElementStart(builder)
    DucPlotElementAddStackElementBase(builder, seb_offset)
    DucPlotElementAddStyle(builder, style_offset)
    DucPlotElementAddLayout(builder, layout_offset)
    return DucPlotElementEnd(builder)

def serialize_fbs_viewport(builder: flatbuffers.Builder, el: DS_DucViewportElement) -> int:
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, el.linear_base)
    stack_base_offset = serialize_fbs_duc_stack_base(builder, el.stack_base)
    style_offset = serialize_fbs_viewport_style(builder, el.style)
    view_offset = serialize_fbs_duc_view(builder, el.view)
    frozen_offsets = [builder.CreateString(s) for s in (el.frozen_group_ids or [])]
    frozen_vec = 0
    if frozen_offsets:
        DucViewportElementStartFrozenGroupIdsVector(builder, len(frozen_offsets))
        for off in reversed(frozen_offsets):
            builder.PrependUOffsetTRelative(off)
        frozen_vec = builder.EndVector()
    standard_override_offset = _str(builder, el.standard_override)

    DucViewportElementStart(builder)
    DucViewportElementAddLinearBase(builder, linear_base_offset)
    DucViewportElementAddStackBase(builder, stack_base_offset)
    DucViewportElementAddStyle(builder, style_offset)
    DucViewportElementAddView(builder, view_offset)
    DucViewportElementAddScale(builder, el.scale)
    if el.shade_plot is not None:
        DucViewportElementAddShadePlot(builder, el.shade_plot)
    if frozen_vec:
        DucViewportElementAddFrozenGroupIds(builder, frozen_vec)
    if standard_override_offset:
        DucViewportElementAddStandardOverride(builder, standard_override_offset)
    return DucViewportElementEnd(builder)

def serialize_fbs_xray(builder: flatbuffers.Builder, el: DS_DucXRayElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    style_offset = serialize_fbs_xray_style(builder, el.style)
    origin_offset = serialize_fbs_duc_point(builder, el.origin)
    direction_offset = serialize_fbs_duc_point(builder, el.direction)
    DucXRayElementStart(builder)
    DucXRayElementAddBase(builder, base_offset)
    DucXRayElementAddStyle(builder, style_offset)
    DucXRayElementAddOrigin(builder, origin_offset)
    DucXRayElementAddDirection(builder, direction_offset)
    DucXRayElementAddStartFromOrigin(builder, el.start_from_origin)
    return DucXRayElementEnd(builder)

def serialize_fbs_leader_content(builder: flatbuffers.Builder, c: Optional[DS_LeaderContent]) -> int:
    if c is None:
        return 0
    # Determine union content
    content_union_type = 0
    content_union_offset = 0
    leader_content_type = 0

    if isinstance(c.content, DS_LeaderTextBlockContent):
        content_union_type = FBS_LeaderContentData.LeaderTextBlockContent
        leader_content_type = LEADER_CONTENT_TYPE.TEXT
        text_offset = builder.CreateString(c.content.text)
        LeaderTextBlockContentStart(builder)
        LeaderTextBlockContentAddText(builder, text_offset)
        content_union_offset = LeaderTextBlockContentEnd(builder)
    elif isinstance(c.content, DS_LeaderBlockContent):
        content_union_type = FBS_LeaderContentData.LeaderBlockContent
        leader_content_type = LEADER_CONTENT_TYPE.BLOCK
        block_id_offset = builder.CreateString(c.content.block_id)
        attr_offsets = [serialize_fbs_string_value_entry(builder, sv) for sv in (c.content.attribute_values or [])]
        elem_offsets = [serialize_fbs_string_value_entry(builder, sv) for sv in (c.content.element_overrides or [])]
        attr_vec = 0
        if attr_offsets:
            LeaderBlockContentStartAttributeValuesVector(builder, len(attr_offsets))
            for off in reversed(attr_offsets):
                builder.PrependUOffsetTRelative(off)
            attr_vec = builder.EndVector()
        elem_vec = 0
        if elem_offsets:
            LeaderBlockContentStartElementOverridesVector(builder, len(elem_offsets))
            for off in reversed(elem_offsets):
                builder.PrependUOffsetTRelative(off)
            elem_vec = builder.EndVector()
        LeaderBlockContentStart(builder)
        LeaderBlockContentAddBlockId(builder, block_id_offset)
        if attr_vec: LeaderBlockContentAddAttributeValues(builder, attr_vec)
        if elem_vec: LeaderBlockContentAddElementOverrides(builder, elem_vec)
        content_union_offset = LeaderBlockContentEnd(builder)

    LeaderContentStart(builder)
    if leader_content_type:
        LeaderContentAddLeaderContentType(builder, leader_content_type)
    if content_union_type and content_union_offset:
        LeaderContentAddContentType(builder, content_union_type)
        LeaderContentAddContent(builder, content_union_offset)
    return LeaderContentEnd(builder)

def serialize_fbs_leader(builder: flatbuffers.Builder, el: DS_DucLeaderElement) -> int:
    linear_base_offset = serialize_fbs_duc_linear_element_base(builder, el.linear_base)
    style_offset = serialize_fbs_leader_style(builder, el.style)
    content_offset = serialize_fbs_leader_content(builder, el.content)
    DucLeaderElementStart(builder)
    DucLeaderElementAddLinearBase(builder, linear_base_offset)
    DucLeaderElementAddStyle(builder, style_offset)
    if content_offset:
        DucLeaderElementAddContent(builder, content_offset)
    # Create the struct right before adding it to avoid StructIsNotInlineError
    anchor_struct = CreateGeometricPoint(builder, el.content_anchor.x, el.content_anchor.y)
    DucLeaderElementAddContentAnchor(builder, anchor_struct)
    return DucLeaderElementEnd(builder)

def serialize_fbs_dimension_definition_points(builder: flatbuffers.Builder, d: DS_DimensionDefinitionPoints) -> int:
    DimensionDefinitionPointsStart(builder)
    if d.origin1:
        DimensionDefinitionPointsAddOrigin1(builder, CreateGeometricPoint(builder, d.origin1.x, d.origin1.y))
    if d.origin2:
        DimensionDefinitionPointsAddOrigin2(builder, CreateGeometricPoint(builder, d.origin2.x, d.origin2.y))
    if d.location:
        DimensionDefinitionPointsAddLocation(builder, CreateGeometricPoint(builder, d.location.x, d.location.y))
    if d.center:
        DimensionDefinitionPointsAddCenter(builder, CreateGeometricPoint(builder, d.center.x, d.center.y))
    if d.jog:
        DimensionDefinitionPointsAddJog(builder, CreateGeometricPoint(builder, d.jog.x, d.jog.y))
    return DimensionDefinitionPointsEnd(builder)

def serialize_fbs_dimension_bindings(builder: flatbuffers.Builder, b: Optional[DS_DimensionBindings]) -> int:
    if b is None:
        return 0
    origin1_offset = serialize_fbs_duc_point_binding(builder, b.origin1)
    origin2_offset = serialize_fbs_duc_point_binding(builder, b.origin2)
    center_offset = serialize_fbs_duc_point_binding(builder, b.center)
    DimensionBindingsStart(builder)
    if origin1_offset: DimensionBindingsAddOrigin1(builder, origin1_offset)
    if origin2_offset: DimensionBindingsAddOrigin2(builder, origin2_offset)
    if center_offset: DimensionBindingsAddCenter(builder, center_offset)
    return DimensionBindingsEnd(builder)

def serialize_fbs_dimension_baseline(builder: flatbuffers.Builder, b: Optional[DS_DimensionBaselineData]) -> int:
    if b is None or not b.base_dimension_id:
        return 0
    base_id_offset = builder.CreateString(b.base_dimension_id)
    DimensionBaselineDataStart(builder)
    DimensionBaselineDataAddBaseDimensionId(builder, base_id_offset)
    return DimensionBaselineDataEnd(builder)

def serialize_fbs_dimension_continue(builder: flatbuffers.Builder, c: Optional[DS_DimensionContinueData]) -> int:
    if c is None or not c.continue_from_dimension_id:
        return 0
    cont_id_offset = builder.CreateString(c.continue_from_dimension_id)
    DimensionContinueDataStart(builder)
    DimensionContinueDataAddContinueFromDimensionId(builder, cont_id_offset)
    return DimensionContinueDataEnd(builder)

def serialize_fbs_datum_reference(builder: flatbuffers.Builder, d: DS_DatumReference) -> int:
    letters_offset = builder.CreateString(d.letters)
    DatumReferenceStart(builder)
    DatumReferenceAddLetters(builder, letters_offset)
    if d.modifier is not None:
        DatumReferenceAddModifier(builder, d.modifier)
    return DatumReferenceEnd(builder)

def serialize_fbs_tolerance_clause(builder: flatbuffers.Builder, t: DS_ToleranceClause) -> int:
    value_offset = builder.CreateString(t.value)
    fm_vec = 0
    if t.feature_modifiers:
        ToleranceClauseStartFeatureModifiersVector(builder, len(t.feature_modifiers))
        for m in reversed(t.feature_modifiers):
            builder.PrependUint8(m)
        fm_vec = builder.EndVector()
    ToleranceClauseStart(builder)
    ToleranceClauseAddValue(builder, value_offset)
    if t.zone_type is not None:
        ToleranceClauseAddZoneType(builder, t.zone_type)
    if fm_vec:
        ToleranceClauseAddFeatureModifiers(builder, fm_vec)
    if t.material_condition is not None:
        ToleranceClauseAddMaterialCondition(builder, t.material_condition)
    return ToleranceClauseEnd(builder)

def serialize_fbs_fcf_segment(builder: flatbuffers.Builder, seg: DS_FeatureControlFrameSegment) -> int:
    tol_offset = serialize_fbs_tolerance_clause(builder, seg.tolerance)
    datum_offsets = [serialize_fbs_datum_reference(builder, d) for d in (seg.datums or [])]
    datums_vec = 0
    if datum_offsets:
        FeatureControlFrameSegmentStartDatumsVector(builder, len(datum_offsets))
        for off in reversed(datum_offsets):
            builder.PrependUOffsetTRelative(off)
        datums_vec = builder.EndVector()
    FeatureControlFrameSegmentStart(builder)
    if seg.symbol is not None:
        FeatureControlFrameSegmentAddSymbol(builder, seg.symbol)
    FeatureControlFrameSegmentAddTolerance(builder, tol_offset)
    if datums_vec:
        FeatureControlFrameSegmentAddDatums(builder, datums_vec)
    return FeatureControlFrameSegmentEnd(builder)

def serialize_fbs_fcf_between_modifier(builder: flatbuffers.Builder, b: Optional[DS_FCFBetweenModifier]) -> int:
    if b is None:
        return 0
    start_offset = builder.CreateString(b.start)
    end_offset = builder.CreateString(b.end)
    FCFBetweenModifierStart(builder)
    FCFBetweenModifierAddStart(builder, start_offset)
    FCFBetweenModifierAddEnd(builder, end_offset)
    return FCFBetweenModifierEnd(builder)

def serialize_fbs_fcf_projected_zone(builder: flatbuffers.Builder, p: Optional[DS_FCFProjectedZoneModifier]) -> int:
    if p is None:
        return 0
    FCFProjectedZoneModifierStart(builder)
    FCFProjectedZoneModifierAddValue(builder, p.value)
    return FCFProjectedZoneModifierEnd(builder)

def serialize_fbs_fcf_frame_modifiers(builder: flatbuffers.Builder, m: Optional[DS_FCFFrameModifiers]) -> int:
    if m is None:
        return 0
    between_offset = serialize_fbs_fcf_between_modifier(builder, m.between)
    proj_offset = serialize_fbs_fcf_projected_zone(builder, m.projected_tolerance_zone)
    FCFFrameModifiersStart(builder)
    if m.all_around is not None:
        FCFFrameModifiersAddAllAround(builder, m.all_around)
    if m.all_over is not None:
        FCFFrameModifiersAddAllOver(builder, m.all_over)
    if m.continuous_feature is not None:
        FCFFrameModifiersAddContinuousFeature(builder, m.continuous_feature)
    if between_offset:
        FCFFrameModifiersAddBetween(builder, between_offset)
    if proj_offset:
        FCFFrameModifiersAddProjectedToleranceZone(builder, proj_offset)
    return FCFFrameModifiersEnd(builder)

def serialize_fbs_fcf_datum_definition(builder: flatbuffers.Builder, d: Optional[DS_FCFDatumDefinition]) -> int:
    if d is None:
        return 0
    letter_offset = builder.CreateString(d.letter)
    binding_offset = serialize_fbs_duc_point_binding(builder, d.feature_binding)
    FCFDatumDefinitionStart(builder)
    FCFDatumDefinitionAddLetter(builder, letter_offset)
    if binding_offset:
        FCFDatumDefinitionAddFeatureBinding(builder, binding_offset)
    return FCFDatumDefinitionEnd(builder)

def serialize_fbs_fcf_segment_row(builder: flatbuffers.Builder, row: DS_FCFSegmentRow) -> int:
    seg_offsets = [serialize_fbs_fcf_segment(builder, s) for s in (row.segments or [])]
    FCFSegmentRowStartSegmentsVector(builder, len(seg_offsets))
    for off in reversed(seg_offsets):
        builder.PrependUOffsetTRelative(off)
    segs_vec = builder.EndVector()
    FCFSegmentRowStart(builder)
    FCFSegmentRowAddSegments(builder, segs_vec)
    return FCFSegmentRowEnd(builder)

def serialize_fbs_feature_control_frame(builder: flatbuffers.Builder, el: DS_DucFeatureControlFrameElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    style_offset = serialize_fbs_feature_control_frame_style(builder, el.style)
    row_offsets = [serialize_fbs_fcf_segment_row(builder, r) for r in (el.rows or [])]
    DucFeatureControlFrameElementStartRowsVector(builder, len(row_offsets))
    for off in reversed(row_offsets):
        builder.PrependUOffsetTRelative(off)
    rows_vec = builder.EndVector()
    modifiers_offset = serialize_fbs_fcf_frame_modifiers(builder, el.frame_modifiers)
    leader_id_offset = _str(builder, el.leader_element_id)
    datum_def_offset = serialize_fbs_fcf_datum_definition(builder, el.datum_definition)
    DucFeatureControlFrameElementStart(builder)
    DucFeatureControlFrameElementAddBase(builder, base_offset)
    DucFeatureControlFrameElementAddStyle(builder, style_offset)
    DucFeatureControlFrameElementAddRows(builder, rows_vec)
    if modifiers_offset:
        DucFeatureControlFrameElementAddFrameModifiers(builder, modifiers_offset)
    if leader_id_offset:
        DucFeatureControlFrameElementAddLeaderElementId(builder, leader_id_offset)
    if datum_def_offset:
        DucFeatureControlFrameElementAddDatumDefinition(builder, datum_def_offset)
    return DucFeatureControlFrameElementEnd(builder)

def serialize_fbs_text_column(builder: flatbuffers.Builder, c: DS_TextColumn) -> int:
    TextColumnStart(builder)
    TextColumnAddWidth(builder, c.width)
    TextColumnAddGutter(builder, c.gutter)
    return TextColumnEnd(builder)

def serialize_fbs_column_layout(builder: flatbuffers.Builder, c: DS_ColumnLayout) -> int:
    defs_offsets = [serialize_fbs_text_column(builder, d) for d in (c.definitions or [])]
    ColumnLayoutStartDefinitionsVector(builder, len(defs_offsets))
    for off in reversed(defs_offsets):
        builder.PrependUOffsetTRelative(off)
    defs_vec = builder.EndVector()
    ColumnLayoutStart(builder)
    if c.type is not None:
        ColumnLayoutAddType(builder, c.type)
    ColumnLayoutAddDefinitions(builder, defs_vec)
    ColumnLayoutAddAutoHeight(builder, c.auto_height)
    return ColumnLayoutEnd(builder)

def serialize_fbs_doc(builder: flatbuffers.Builder, el: DS_DucDocElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    style_offset = serialize_fbs_doc_style(builder, el.style)
    text_offset = builder.CreateString(el.text)
    dynamic_offsets = [serialize_fbs_text_dynamic_part(builder, p) for p in (el.dynamic or [])]
    dyn_vec = 0
    if dynamic_offsets:
        DucDocElementStartDynamicVector(builder, len(dynamic_offsets))
        for off in reversed(dynamic_offsets):
            builder.PrependUOffsetTRelative(off)
        dyn_vec = builder.EndVector()
    columns_offset = serialize_fbs_column_layout(builder, el.columns)
    DucDocElementStart(builder)
    DucDocElementAddBase(builder, base_offset)
    DucDocElementAddStyle(builder, style_offset)
    DucDocElementAddText(builder, text_offset)
    if dyn_vec: DucDocElementAddDynamic(builder, dyn_vec)
    if el.flow_direction is not None:
        DucDocElementAddFlowDirection(builder, el.flow_direction)
    DucDocElementAddColumns(builder, columns_offset)
    DucDocElementAddAutoResize(builder, el.auto_resize)
    return DucDocElementEnd(builder)

def serialize_fbs_parametric_source(builder: flatbuffers.Builder, s: DS_ParametricSource) -> int:
    code_offset = _str(builder, s.code)
    file_id_offset = _str(builder, s.file_id)
    ParametricSourceStart(builder)
    if s.type is not None:
        ParametricSourceAddType(builder, s.type)
    if code_offset:
        ParametricSourceAddCode(builder, code_offset)
    if file_id_offset:
        ParametricSourceAddFileId(builder, file_id_offset)
    return ParametricSourceEnd(builder)

def serialize_fbs_parametric(builder: flatbuffers.Builder, el: DS_DucParametricElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    source_offset = serialize_fbs_parametric_source(builder, el.source)
    DucParametricElementStart(builder)
    DucParametricElementAddBase(builder, base_offset)
    DucParametricElementAddSource(builder, source_offset)
    return DucParametricElementEnd(builder)

# =============================================================================
# Element union and wrapper
# =============================================================================

ELEMENT_TYPE_MAP = {
    DS_DucRectangleElement: FBS_Element.DucRectangleElement,
    DS_DucPolygonElement: FBS_Element.DucPolygonElement,
    DS_DucEllipseElement: FBS_Element.DucEllipseElement,
    DS_DucEmbeddableElement: FBS_Element.DucEmbeddableElement,
    DS_DucPdfElement: FBS_Element.DucPdfElement,
    DS_DucMermaidElement: FBS_Element.DucMermaidElement,
    DS_DucTableElement: FBS_Element.DucTableElement,
    DS_DucImageElement: FBS_Element.DucImageElement,
    DS_DucTextElement: FBS_Element.DucTextElement,
    DS_DucLinearElement: FBS_Element.DucLinearElement,
    DS_DucArrowElement: FBS_Element.DucArrowElement,
    DS_DucFreeDrawElement: FBS_Element.DucFreeDrawElement,
    DS_DucBlockInstanceElement: FBS_Element.DucBlockInstanceElement,
    DS_DucFrameElement: FBS_Element.DucFrameElement,
    DS_DucPlotElement: FBS_Element.DucPlotElement,
    DS_DucViewportElement: FBS_Element.DucViewportElement,
    DS_DucXRayElement: FBS_Element.DucXRayElement,
    DS_DucLeaderElement: FBS_Element.DucLeaderElement,
    DS_DucDimensionElement: FBS_Element.DucDimensionElement,
    DS_DucFeatureControlFrameElement: FBS_Element.DucFeatureControlFrameElement,
    DS_DucDocElement: FBS_Element.DucDocElement,
    DS_DucParametricElement: FBS_Element.DucParametricElement,
}

ELEMENT_SERIALIZER_MAP = {
    DS_DucRectangleElement: serialize_fbs_rectangle,
    DS_DucPolygonElement: serialize_fbs_polygon,
    DS_DucEllipseElement: serialize_fbs_ellipse,
    DS_DucEmbeddableElement: serialize_fbs_embeddable,
    DS_DucPdfElement: serialize_fbs_pdf,
    DS_DucMermaidElement: serialize_fbs_mermaid,
    DS_DucTableElement: serialize_fbs_table,
    DS_DucImageElement: serialize_fbs_image,
    DS_DucTextElement: serialize_fbs_text,
    DS_DucLinearElement: serialize_fbs_linear,
    DS_DucArrowElement: serialize_fbs_arrow,
    DS_DucFreeDrawElement: serialize_fbs_freedraw,
    DS_DucBlockInstanceElement: serialize_fbs_block_instance,
    DS_DucFrameElement: serialize_fbs_frame,
    DS_DucPlotElement: serialize_fbs_plot,
    DS_DucViewportElement: serialize_fbs_viewport,
    DS_DucXRayElement: serialize_fbs_xray,
    DS_DucLeaderElement: serialize_fbs_leader,
    DS_DucDimensionElement: None,  # defined below
    DS_DucFeatureControlFrameElement: serialize_fbs_feature_control_frame,
    DS_DucDocElement: serialize_fbs_doc,
    DS_DucParametricElement: serialize_fbs_parametric,
}

def serialize_fbs_dimension(builder: flatbuffers.Builder, el: DS_DucDimensionElement) -> int:
    base_offset = serialize_fbs_duc_element_base(builder, el.base)
    style_offset = serialize_fbs_dimension_style(builder, el.style)
    def_points_offset = serialize_fbs_dimension_definition_points(builder, el.definition_points)
    bindings_offset = serialize_fbs_dimension_bindings(builder, el.bindings)
    text_override_offset = _str(builder, el.text_override)
    text_pos_struct = 0
    if el.text_position:
        text_pos_struct = CreateGeometricPoint(builder, el.text_position.x, el.text_position.y)
    tol_override_offset = serialize_fbs_dimension_tolerance_style(builder, el.tolerance_override)
    baseline_offset = serialize_fbs_dimension_baseline(builder, el.baseline_data)
    continue_offset = serialize_fbs_dimension_continue(builder, el.continue_data)

    DucDimensionElementStart(builder)
    DucDimensionElementAddBase(builder, base_offset)
    DucDimensionElementAddStyle(builder, style_offset)
    if el.dimension_type is not None:
        DucDimensionElementAddDimensionType(builder, el.dimension_type)
    DucDimensionElementAddDefinitionPoints(builder, def_points_offset)
    DucDimensionElementAddObliqueAngle(builder, el.oblique_angle)
    if el.ordinate_axis is not None:
        DucDimensionElementAddOrdinateAxis(builder, el.ordinate_axis)
    if bindings_offset:
        DucDimensionElementAddBindings(builder, bindings_offset)
    if text_override_offset:
        DucDimensionElementAddTextOverride(builder, text_override_offset)
    if text_pos_struct:
        DucDimensionElementAddTextPosition(builder, text_pos_struct)
    if tol_override_offset:
        DucDimensionElementAddToleranceOverride(builder, tol_override_offset)
    if baseline_offset:
        DucDimensionElementAddBaselineData(builder, baseline_offset)
    if continue_offset:
        DucDimensionElementAddContinueData(builder, continue_offset)
    return DucDimensionElementEnd(builder)

# register dimension serializer
ELEMENT_SERIALIZER_MAP[DS_DucDimensionElement] = serialize_fbs_dimension

def serialize_fbs_element_wrapper(builder: flatbuffers.Builder, wrapper: DS_ElementWrapper) -> int:
    element = wrapper.element
    typ = ELEMENT_TYPE_MAP.get(type(element))
    serializer = ELEMENT_SERIALIZER_MAP.get(type(element))
    if typ is None or serializer is None:
        logger.warning(f"Unsupported element type for serialization: {type(element)}")
        return 0
    elem_offset = serializer(builder, element)
    ElementWrapperStart(builder)
    ElementWrapperAddElementType(builder, typ)
    ElementWrapperAddElement(builder, elem_offset)
    return ElementWrapperEnd(builder)
  
  
# ============================
# Part 2/5 continues here
# ============================

# Additional imports for Standards, Units, Overrides, Views and Validation
from ducpy.Duc._UnitSystemBase import (
    _UnitSystemBaseStart, _UnitSystemBaseAddSystem, _UnitSystemBaseAddPrecision,
    _UnitSystemBaseAddSuppressLeadingZeros, _UnitSystemBaseAddSuppressTrailingZeros, _UnitSystemBaseEnd
)
from ducpy.Duc.UnitPrecision import (
    UnitPrecisionStart, UnitPrecisionAddLinear, UnitPrecisionAddAngular, UnitPrecisionAddArea,
    UnitPrecisionAddVolume, UnitPrecisionEnd
)
from ducpy.Duc.StandardStyles import (
    StandardStylesStart, StandardStylesAddCommonStyles, StandardStylesAddStackLikeStyles,
    StandardStylesAddTextStyles, StandardStylesAddDimensionStyles, StandardStylesAddLeaderStyles,
    StandardStylesAddFeatureControlFrameStyles, StandardStylesAddTableStyles, StandardStylesAddDocStyles,
    StandardStylesAddViewportStyles, StandardStylesAddHatchStyles, StandardStylesAddXrayStyles, StandardStylesEnd,
    StandardStylesStartCommonStylesVector, StandardStylesStartStackLikeStylesVector,
    StandardStylesStartTextStylesVector, StandardStylesStartDimensionStylesVector,
    StandardStylesStartLeaderStylesVector, StandardStylesStartFeatureControlFrameStylesVector,
    StandardStylesStartTableStylesVector, StandardStylesStartDocStylesVector,
    StandardStylesStartViewportStylesVector, StandardStylesStartHatchStylesVector,
    StandardStylesStartXrayStylesVector
)
from ducpy.Duc.DucCommonStyle import (
    DucCommonStyleStart, DucCommonStyleAddBackground, DucCommonStyleAddStroke, DucCommonStyleEnd
)
from ducpy.Duc.IdentifiedCommonStyle import (
    IdentifiedCommonStyleStart, IdentifiedCommonStyleAddId, IdentifiedCommonStyleAddStyle, IdentifiedCommonStyleEnd
)
from ducpy.Duc.IdentifiedStackLikeStyle import (
    IdentifiedStackLikeStyleStart, IdentifiedStackLikeStyleAddId, IdentifiedStackLikeStyleAddStyle,
    IdentifiedStackLikeStyleEnd
)
from ducpy.Duc.IdentifiedTextStyle import (
    IdentifiedTextStyleStart, IdentifiedTextStyleAddId, IdentifiedTextStyleAddStyle, IdentifiedTextStyleEnd
)
from ducpy.Duc.IdentifiedDimensionStyle import (
    IdentifiedDimensionStyleStart, IdentifiedDimensionStyleAddId, IdentifiedDimensionStyleAddStyle,
    IdentifiedDimensionStyleEnd
)
from ducpy.Duc.IdentifiedLeaderStyle import (
    IdentifiedLeaderStyleStart, IdentifiedLeaderStyleAddId, IdentifiedLeaderStyleAddStyle, IdentifiedLeaderStyleEnd
)
from ducpy.Duc.IdentifiedFCFStyle import (
    IdentifiedFCFStyleStart, IdentifiedFCFStyleAddId, IdentifiedFCFStyleAddStyle, IdentifiedFCFStyleEnd
)
from ducpy.Duc.IdentifiedTableStyle import (
    IdentifiedTableStyleStart, IdentifiedTableStyleAddId, IdentifiedTableStyleAddStyle, IdentifiedTableStyleEnd
)
from ducpy.Duc.IdentifiedDocStyle import (
    IdentifiedDocStyleStart, IdentifiedDocStyleAddId, IdentifiedDocStyleAddStyle, IdentifiedDocStyleEnd
)
from ducpy.Duc.IdentifiedViewportStyle import (
    IdentifiedViewportStyleStart, IdentifiedViewportStyleAddId, IdentifiedViewportStyleAddStyle,
    IdentifiedViewportStyleEnd
)
from ducpy.Duc.IdentifiedHatchStyle import (
    IdentifiedHatchStyleStart, IdentifiedHatchStyleAddId, IdentifiedHatchStyleAddStyle, IdentifiedHatchStyleEnd
)
from ducpy.Duc.IdentifiedXRayStyle import (
    IdentifiedXRayStyleStart, IdentifiedXRayStyleAddId, IdentifiedXRayStyleAddStyle, IdentifiedXRayStyleEnd
)
from ducpy.Duc.StandardOverrides import (
    StandardOverridesStart, StandardOverridesAddMainScope, StandardOverridesAddElementsStrokeWidthOverride,
    StandardOverridesAddCommonStyleId, StandardOverridesAddStackLikeStyleId, StandardOverridesAddTextStyleId,
    StandardOverridesAddDimensionStyleId, StandardOverridesAddLeaderStyleId, StandardOverridesAddFeatureControlFrameStyleId,
    StandardOverridesAddTableStyleId, StandardOverridesAddDocStyleId, StandardOverridesAddViewportStyleId,
    StandardOverridesAddPlotStyleId, StandardOverridesAddHatchStyleId, StandardOverridesAddActiveGridSettingsId,
    StandardOverridesAddActiveSnapSettingsId, StandardOverridesAddDashLineOverride, StandardOverridesAddUnitPrecision,
    StandardOverridesEnd, StandardOverridesStartActiveGridSettingsIdVector
)
from ducpy.Duc.LinearUnitSystem import (
    LinearUnitSystemStart, LinearUnitSystemAddBase, LinearUnitSystemAddFormat, LinearUnitSystemAddDecimalSeparator,
    LinearUnitSystemAddSuppressZeroFeet, LinearUnitSystemAddSuppressZeroInches, LinearUnitSystemEnd
)
from ducpy.Duc.AngularUnitSystem import (
    AngularUnitSystemStart, AngularUnitSystemAddBase, AngularUnitSystemAddFormat, AngularUnitSystemEnd
)
from ducpy.Duc.AlternateUnits import (
    AlternateUnitsStart, AlternateUnitsAddBase, AlternateUnitsAddFormat, AlternateUnitsAddIsVisible,
    AlternateUnitsAddMultiplier, AlternateUnitsEnd
)
from ducpy.Duc.PrimaryUnits import (
    PrimaryUnitsStart, PrimaryUnitsAddLinear, PrimaryUnitsAddAngular, PrimaryUnitsEnd
)
from ducpy.Duc.StandardUnits import (
    StandardUnitsStart, StandardUnitsAddPrimaryUnits, StandardUnitsAddAlternateUnits, StandardUnitsEnd
)
from ducpy.Duc.GridStyle import (
    GridStyleStart, GridStyleAddColor, GridStyleAddOpacity, GridStyleAddDashPattern, GridStyleEnd,
    GridStyleStartDashPatternVector
)
from ducpy.Duc.PolarGridSettings import (
    PolarGridSettingsStart, PolarGridSettingsAddRadialDivisions, PolarGridSettingsAddRadialSpacing,
    PolarGridSettingsAddShowLabels, PolarGridSettingsEnd
)
from ducpy.Duc.IsometricGridSettings import (
    IsometricGridSettingsStart, IsometricGridSettingsAddLeftAngle, IsometricGridSettingsAddRightAngle,
    IsometricGridSettingsEnd
)
from ducpy.Duc.GridSettings import (
    GridSettingsStart, GridSettingsAddType, GridSettingsAddReadonly, GridSettingsAddDisplayType,
    GridSettingsAddIsAdaptive, GridSettingsAddXSpacing, GridSettingsAddYSpacing, GridSettingsAddSubdivisions,
    GridSettingsAddOrigin, GridSettingsAddRotation, GridSettingsAddFollowUcs, GridSettingsAddMajorStyle,
    GridSettingsAddMinorStyle, GridSettingsAddShowMinor, GridSettingsAddMinZoom, GridSettingsAddMaxZoom,
    GridSettingsAddAutoHide, GridSettingsAddPolarSettings, GridSettingsAddIsometricSettings,
    GridSettingsAddEnableSnapping, GridSettingsEnd
)
from ducpy.Duc.SnapOverride import (
    SnapOverrideStart, SnapOverrideAddKey, SnapOverrideAddBehavior, SnapOverrideEnd
)
from ducpy.Duc.DynamicSnapSettings import (
    DynamicSnapSettingsStart, DynamicSnapSettingsAddEnabledDuringDrag, DynamicSnapSettingsAddEnabledDuringRotation,
    DynamicSnapSettingsAddEnabledDuringScale, DynamicSnapSettingsEnd
)
from ducpy.Duc.PolarTrackingSettings import (
    PolarTrackingSettingsStart, PolarTrackingSettingsAddEnabled, PolarTrackingSettingsAddAngles,
    PolarTrackingSettingsAddIncrementAngle, PolarTrackingSettingsAddTrackFromLastPoint,
    PolarTrackingSettingsAddShowPolarCoordinates, PolarTrackingSettingsEnd, PolarTrackingSettingsStartAnglesVector
)
from ducpy.Duc.TrackingLineStyle import (
    TrackingLineStyleStart, TrackingLineStyleAddColor, TrackingLineStyleAddOpacity,
    TrackingLineStyleAddDashPattern, TrackingLineStyleEnd, TrackingLineStyleStartDashPatternVector
)
from ducpy.Duc.LayerSnapFilters import (
    LayerSnapFiltersStart, LayerSnapFiltersAddIncludeLayers, LayerSnapFiltersAddExcludeLayers, LayerSnapFiltersEnd,
    LayerSnapFiltersStartIncludeLayersVector, LayerSnapFiltersStartExcludeLayersVector
)
from ducpy.Duc.SnapMarkerStyle import (
    SnapMarkerStyleStart, SnapMarkerStyleAddShape, SnapMarkerStyleAddColor, SnapMarkerStyleEnd
)
from ducpy.Duc.SnapMarkerStyleEntry import (
    SnapMarkerStyleEntryStart, SnapMarkerStyleEntryAddKey, SnapMarkerStyleEntryAddValue, SnapMarkerStyleEntryEnd
)
from ducpy.Duc.SnapMarkerSettings import (
    SnapMarkerSettingsStart, SnapMarkerSettingsAddEnabled, SnapMarkerSettingsAddSize, SnapMarkerSettingsAddDuration,
    SnapMarkerSettingsAddStyles, SnapMarkerSettingsEnd, SnapMarkerSettingsStartStylesVector
)
from ducpy.Duc.SnapSettings import (
    SnapSettingsStart, SnapSettingsAddReadonly, SnapSettingsAddTwistAngle, SnapSettingsAddSnapTolerance,
    SnapSettingsAddObjectSnapAperture, SnapSettingsAddIsOrthoModeOn, SnapSettingsAddPolarTracking,
    SnapSettingsAddIsObjectSnapOn, SnapSettingsAddActiveObjectSnapModes, SnapSettingsAddSnapPriority,
    SnapSettingsAddShowTrackingLines, SnapSettingsAddTrackingLineStyle, SnapSettingsAddDynamicSnap,
    SnapSettingsAddTemporaryOverrides, SnapSettingsAddIncrementalDistance, SnapSettingsAddMagneticStrength,
    SnapSettingsAddLayerSnapFilters, SnapSettingsAddElementTypeFilters, SnapSettingsAddSnapMode,
    SnapSettingsAddSnapMarkers, SnapSettingsAddConstructionSnapEnabled, SnapSettingsAddSnapToGridIntersections,
    SnapSettingsEnd, SnapSettingsStartActiveObjectSnapModesVector, SnapSettingsStartSnapPriorityVector,
    SnapSettingsStartTemporaryOverridesVector, SnapSettingsStartElementTypeFiltersVector
)
from ducpy.Duc.IdentifiedGridSettings import (
    IdentifiedGridSettingsStart, IdentifiedGridSettingsAddId, IdentifiedGridSettingsAddSettings,
    IdentifiedGridSettingsEnd
)
from ducpy.Duc.IdentifiedSnapSettings import (
    IdentifiedSnapSettingsStart, IdentifiedSnapSettingsAddId, IdentifiedSnapSettingsAddSettings,
    IdentifiedSnapSettingsEnd
)
from ducpy.Duc.IdentifiedUcs import (
    IdentifiedUcsStart, IdentifiedUcsAddId, IdentifiedUcsAddUcs, IdentifiedUcsEnd
)
from ducpy.Duc.IdentifiedView import (
    IdentifiedViewStart, IdentifiedViewAddId, IdentifiedViewAddView, IdentifiedViewEnd
)
from ducpy.Duc.StandardViewSettings import (
    StandardViewSettingsStart, StandardViewSettingsAddViews, StandardViewSettingsAddUcs,
    StandardViewSettingsAddGridSettings, StandardViewSettingsAddSnapSettings, StandardViewSettingsEnd,
    StandardViewSettingsStartViewsVector, StandardViewSettingsStartUcsVector,
    StandardViewSettingsStartGridSettingsVector, StandardViewSettingsStartSnapSettingsVector
)
from ducpy.Duc.DimensionValidationRules import (
    DimensionValidationRulesStart, DimensionValidationRulesAddMinTextHeight, DimensionValidationRulesAddMaxTextHeight,
    DimensionValidationRulesAddAllowedPrecisions, DimensionValidationRulesEnd,
    DimensionValidationRulesStartAllowedPrecisionsVector
)
from ducpy.Duc.LayerValidationRules import (
    LayerValidationRulesStart, LayerValidationRulesAddProhibitedLayerNames, LayerValidationRulesEnd,
    LayerValidationRulesStartProhibitedLayerNamesVector
)
from ducpy.Duc.StandardValidation import (
    StandardValidationStart, StandardValidationAddDimensionRules, StandardValidationAddLayerRules, StandardValidationEnd
)
from ducpy.Duc.Standard import (
    StandardStart, StandardAddIdentifier, StandardAddVersion, StandardAddReadonly, StandardAddOverrides,
    StandardAddStyles, StandardAddViewSettings, StandardAddUnits, StandardAddValidation, StandardEnd
)

# Blocks, groups, regions, layers already partially imported in Part 1
from ducpy.Duc.DucBlockAttributeDefinition import (
    DucBlockAttributeDefinitionStart, DucBlockAttributeDefinitionAddTag, DucBlockAttributeDefinitionAddPrompt,
    DucBlockAttributeDefinitionAddDefaultValue, DucBlockAttributeDefinitionAddIsConstant,
    DucBlockAttributeDefinitionEnd
)
from ducpy.Duc.DucBlockAttributeDefinitionEntry import (
    DucBlockAttributeDefinitionEntryStart, DucBlockAttributeDefinitionEntryAddKey,
    DucBlockAttributeDefinitionEntryAddValue, DucBlockAttributeDefinitionEntryEnd
)
from ducpy.Duc.DucBlock import (
    DucBlockStart, DucBlockAddId, DucBlockAddLabel, DucBlockAddDescription, DucBlockAddVersion,
    DucBlockAddElements, DucBlockAddAttributeDefinitions, DucBlockEnd, DucBlockStartElementsVector,
    DucBlockStartAttributeDefinitionsVector
)

# Global/Local State (vector helpers)
from ducpy.Duc.DucLocalState import (
    DucLocalStateStart, DucLocalStateAddScope, DucLocalStateAddActiveStandardId, DucLocalStateAddScrollX,
    DucLocalStateAddScrollY, DucLocalStateAddZoom, DucLocalStateAddActiveGridSettings, DucLocalStateAddActiveSnapSettings,
    DucLocalStateAddIsBindingEnabled, DucLocalStateAddCurrentItemStroke, DucLocalStateAddCurrentItemBackground,
    DucLocalStateAddCurrentItemOpacity, DucLocalStateAddCurrentItemFontFamily, DucLocalStateAddCurrentItemFontSize,
    DucLocalStateAddCurrentItemTextAlign, DucLocalStateAddCurrentItemStartLineHead, DucLocalStateAddCurrentItemEndLineHead,
    DucLocalStateAddCurrentItemRoundness, DucLocalStateAddPenMode, DucLocalStateAddViewModeEnabled,
    DucLocalStateAddObjectsSnapModeEnabled, DucLocalStateAddGridModeEnabled, DucLocalStateAddOutlineModeEnabled,
    DucLocalStateEnd, DucLocalStateStartActiveGridSettingsVector
)
from ducpy.Duc.DucGlobalState import (
    DucGlobalStateStart, DucGlobalStateAddName, DucGlobalStateAddViewBackgroundColor, DucGlobalStateAddMainScope,
    DucGlobalStateAddDashSpacingScale, DucGlobalStateAddIsDashSpacingAffectedByViewportScale,
    DucGlobalStateAddScopeExponentThreshold, DucGlobalStateAddDimensionsAssociativeByDefault,
    DucGlobalStateAddUseAnnotativeScaling, DucGlobalStateAddDisplayPrecisionLinear,
    DucGlobalStateAddDisplayPrecisionAngular, DucGlobalStateEnd
)

# External Files
from ducpy.Duc.DucExternalFileData import (
    DucExternalFileDataStart, DucExternalFileDataAddMimeType, DucExternalFileDataAddId, DucExternalFileDataAddData,
    DucExternalFileDataAddCreated, DucExternalFileDataAddLastRetrieved, DucExternalFileDataEnd
)
from ducpy.Duc.DucExternalFileEntry import (
    DucExternalFileEntryStart, DucExternalFileEntryAddKey, DucExternalFileEntryAddValue, DucExternalFileEntryEnd
)

# Version Graph
from ducpy.Duc.VersionBase import (
    VersionBaseStart, VersionBaseAddId, VersionBaseAddParentId, VersionBaseAddTimestamp,
    VersionBaseAddDescription, VersionBaseAddIsManualSave, VersionBaseAddUserId, VersionBaseEnd
)
from ducpy.Duc.Checkpoint import (
    CheckpointStart, CheckpointAddBase, CheckpointAddData, CheckpointAddSizeBytes, CheckpointEnd
)
from ducpy.Duc.JSONPatchOperation import (
    JSONPatchOperationStart, JSONPatchOperationAddOp, JSONPatchOperationAddPath, JSONPatchOperationAddFrom,
    JSONPatchOperationAddValue, JSONPatchOperationEnd
)
from ducpy.Duc.Delta import (
    DeltaStart, DeltaAddBase, DeltaAddPatch, DeltaEnd, DeltaStartPatchVector
)
from ducpy.Duc.VersionGraphMetadata import (
    VersionGraphMetadataStart, VersionGraphMetadataAddPruningLevel, VersionGraphMetadataAddLastPruned,
    VersionGraphMetadataAddTotalSize, VersionGraphMetadataEnd
)
from ducpy.Duc.VersionGraph import (
    VersionGraphStart, VersionGraphAddUserCheckpointVersionId, VersionGraphAddLatestVersionId,
    VersionGraphAddCheckpoints, VersionGraphAddDeltas, VersionGraphAddMetadata, VersionGraphEnd,
    VersionGraphStartCheckpointsVector, VersionGraphStartDeltasVector
)

# Root: ExportedDataState vector helpers for fields we use in Part 2 too (already imported in Part 1)

# -----------------------------------------------------------------------------
# Standards: Units
# -----------------------------------------------------------------------------

def serialize_fbs_unit_system_base(builder: flatbuffers.Builder, base: DS_UnitSystemBase) -> int:
    _UnitSystemBaseStart(builder)
    if base.system is not None:
        _UnitSystemBaseAddSystem(builder, base.system)
    _UnitSystemBaseAddPrecision(builder, base.precision)
    _UnitSystemBaseAddSuppressLeadingZeros(builder, base.suppress_leading_zeros)
    _UnitSystemBaseAddSuppressTrailingZeros(builder, base.suppress_trailing_zeros)
    return _UnitSystemBaseEnd(builder)

def serialize_fbs_linear_unit_system(builder: flatbuffers.Builder, l: Optional[DS_LinearUnitSystem]) -> int:
    if l is None:
        return 0
    base_offset = serialize_fbs_unit_system_base(builder, l)
    LinearUnitSystemStart(builder)
    LinearUnitSystemAddBase(builder, base_offset)
    if l.format is not None:
        LinearUnitSystemAddFormat(builder, l.format)
    if l.decimal_separator is not None:
        LinearUnitSystemAddDecimalSeparator(builder, l.decimal_separator)
    LinearUnitSystemAddSuppressZeroFeet(builder, l.suppress_zero_feet)
    LinearUnitSystemAddSuppressZeroInches(builder, l.suppress_zero_inches)
    return LinearUnitSystemEnd(builder)

def serialize_fbs_angular_unit_system(builder: flatbuffers.Builder, a: Optional[DS_AngularUnitSystem]) -> int:
    if a is None:
        return 0
    base_offset = serialize_fbs_unit_system_base(builder, a)
    AngularUnitSystemStart(builder)
    AngularUnitSystemAddBase(builder, base_offset)
    if a.format is not None:
        AngularUnitSystemAddFormat(builder, a.format)
    return AngularUnitSystemEnd(builder)

def serialize_fbs_alternate_units(builder: flatbuffers.Builder, a: Optional[DS_AlternateUnits]) -> int:
    if a is None:
        return 0
    base_offset = serialize_fbs_unit_system_base(builder, a)
    AlternateUnitsStart(builder)
    AlternateUnitsAddBase(builder, base_offset)
    if a.format is not None:
        AlternateUnitsAddFormat(builder, a.format)
    AlternateUnitsAddIsVisible(builder, a.is_visible)
    AlternateUnitsAddMultiplier(builder, a.multiplier)
    return AlternateUnitsEnd(builder)

def serialize_fbs_primary_units(builder: flatbuffers.Builder, pu: Optional[DS_PrimaryUnits]) -> int:
    if pu is None:
        return 0
    linear_offset = serialize_fbs_linear_unit_system(builder, pu.linear)
    angular_offset = serialize_fbs_angular_unit_system(builder, pu.angular)
    PrimaryUnitsStart(builder)
    if linear_offset:
        PrimaryUnitsAddLinear(builder, linear_offset)
    if angular_offset:
        PrimaryUnitsAddAngular(builder, angular_offset)
    return PrimaryUnitsEnd(builder)

def serialize_fbs_standard_units(builder: flatbuffers.Builder, u: Optional[DS_StandardUnits]) -> int:
    if u is None:
        return 0
    primary_offset = serialize_fbs_primary_units(builder, u.primary_units)
    alternate_offset = serialize_fbs_alternate_units(builder, u.alternate_units)
    StandardUnitsStart(builder)
    if primary_offset: StandardUnitsAddPrimaryUnits(builder, primary_offset)
    if alternate_offset: StandardUnitsAddAlternateUnits(builder, alternate_offset)
    return StandardUnitsEnd(builder)

# -----------------------------------------------------------------------------
# Standards: Overrides
# -----------------------------------------------------------------------------

def serialize_fbs_unit_precision(builder: flatbuffers.Builder, up: Optional[DS_UnitPrecision]) -> int:
    if up is None:
        return 0
    UnitPrecisionStart(builder)
    UnitPrecisionAddLinear(builder, up.linear)
    UnitPrecisionAddAngular(builder, up.angular)
    UnitPrecisionAddArea(builder, up.area)
    UnitPrecisionAddVolume(builder, up.volume)
    return UnitPrecisionEnd(builder)

def serialize_fbs_standard_overrides(builder: flatbuffers.Builder, o: Optional[DS_StandardOverrides]) -> int:
    if o is None:
        return 0
    
    # Create all strings first before starting any vectors
    main_scope_offset = _str(builder, o.main_scope)
    common_style_id_offset = _str(builder, o.common_style_id)
    stack_like_style_id_offset = _str(builder, o.stack_like_style_id)
    text_style_id_offset = _str(builder, o.text_style_id)
    dim_style_id_offset = _str(builder, o.dimension_style_id)
    leader_style_id_offset = _str(builder, o.leader_style_id)
    fcf_style_id_offset = _str(builder, o.feature_control_frame_style_id)
    table_style_id_offset = _str(builder, o.table_style_id)
    doc_style_id_offset = _str(builder, o.doc_style_id)
    viewport_style_id_offset = _str(builder, o.viewport_style_id)
    plot_style_id_offset = _str(builder, o.plot_style_id)
    hatch_style_id_offset = _str(builder, o.hatch_style_id)
    active_snap_settings_id_offset = _str(builder, o.active_snap_settings_id)
    dash_line_override_offset = _str(builder, o.dash_line_override)
    unit_precision_offset = serialize_fbs_unit_precision(builder, o.unit_precision)

    # Create vector for active_grid_settings_id
    active_grid_vec = 0
    if o.active_grid_settings_id:
        # Create all strings first
        grid_string_offsets = [builder.CreateString(s) for s in o.active_grid_settings_id]
        StandardOverridesStartActiveGridSettingsIdVector(builder, len(grid_string_offsets))
        for off in reversed(grid_string_offsets):
            builder.PrependUOffsetTRelative(off)
        active_grid_vec = builder.EndVector()

    StandardOverridesStart(builder)
    if unit_precision_offset:
        StandardOverridesAddUnitPrecision(builder, unit_precision_offset)
    if main_scope_offset: StandardOverridesAddMainScope(builder, main_scope_offset)
    if o.elements_stroke_width_override is not None:
        StandardOverridesAddElementsStrokeWidthOverride(builder, o.elements_stroke_width_override)
    if common_style_id_offset: StandardOverridesAddCommonStyleId(builder, common_style_id_offset)
    if stack_like_style_id_offset: StandardOverridesAddStackLikeStyleId(builder, stack_like_style_id_offset)
    if text_style_id_offset: StandardOverridesAddTextStyleId(builder, text_style_id_offset)
    if dim_style_id_offset: StandardOverridesAddDimensionStyleId(builder, dim_style_id_offset)
    if leader_style_id_offset: StandardOverridesAddLeaderStyleId(builder, leader_style_id_offset)
    if fcf_style_id_offset: StandardOverridesAddFeatureControlFrameStyleId(builder, fcf_style_id_offset)
    if table_style_id_offset: StandardOverridesAddTableStyleId(builder, table_style_id_offset)
    if doc_style_id_offset: StandardOverridesAddDocStyleId(builder, doc_style_id_offset)
    if viewport_style_id_offset: StandardOverridesAddViewportStyleId(builder, viewport_style_id_offset)
    if plot_style_id_offset: StandardOverridesAddPlotStyleId(builder, plot_style_id_offset)
    if hatch_style_id_offset: StandardOverridesAddHatchStyleId(builder, hatch_style_id_offset)
    if active_grid_vec: StandardOverridesAddActiveGridSettingsId(builder, active_grid_vec)
    if active_snap_settings_id_offset: StandardOverridesAddActiveSnapSettingsId(builder, active_snap_settings_id_offset)
    if dash_line_override_offset: StandardOverridesAddDashLineOverride(builder, dash_line_override_offset)
    return StandardOverridesEnd(builder)

# -----------------------------------------------------------------------------
# Standards: Styles
# -----------------------------------------------------------------------------

def serialize_fbs_common_style(builder: flatbuffers.Builder, s: DS_DucCommonStyle) -> int:
    bg_offset = serialize_fbs_element_background(builder, s.background)
    stroke_offset = serialize_fbs_element_stroke(builder, s.stroke)
    DucCommonStyleStart(builder)
    DucCommonStyleAddBackground(builder, bg_offset)
    DucCommonStyleAddStroke(builder, stroke_offset)
    return DucCommonStyleEnd(builder)

def serialize_fbs_identified_common_style(builder: flatbuffers.Builder, x: DS_IdentifiedCommonStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_common_style(builder, x.style)
    IdentifiedCommonStyleStart(builder)
    IdentifiedCommonStyleAddId(builder, id_offset)
    IdentifiedCommonStyleAddStyle(builder, style_offset)
    return IdentifiedCommonStyleEnd(builder)

def serialize_fbs_identified_stack_like_style(builder: flatbuffers.Builder, x: DS_IdentifiedStackLikeStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_duc_stack_like_styles(builder, x.style)
    IdentifiedStackLikeStyleStart(builder)
    IdentifiedStackLikeStyleAddId(builder, id_offset)
    IdentifiedStackLikeStyleAddStyle(builder, style_offset)
    return IdentifiedStackLikeStyleEnd(builder)

def serialize_fbs_identified_text_style(builder: flatbuffers.Builder, x: DS_IdentifiedTextStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_duc_text_style(builder, x.style)
    IdentifiedTextStyleStart(builder)
    IdentifiedTextStyleAddId(builder, id_offset)
    IdentifiedTextStyleAddStyle(builder, style_offset)
    return IdentifiedTextStyleEnd(builder)

def serialize_fbs_identified_dimension_style(builder: flatbuffers.Builder, x: DS_IdentifiedDimensionStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_dimension_style(builder, x.style)
    IdentifiedDimensionStyleStart(builder)
    IdentifiedDimensionStyleAddId(builder, id_offset)
    IdentifiedDimensionStyleAddStyle(builder, style_offset)
    return IdentifiedDimensionStyleEnd(builder)

def serialize_fbs_identified_leader_style(builder: flatbuffers.Builder, x: DS_IdentifiedLeaderStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_leader_style(builder, x.style)
    IdentifiedLeaderStyleStart(builder)
    IdentifiedLeaderStyleAddId(builder, id_offset)
    IdentifiedLeaderStyleAddStyle(builder, style_offset)
    return IdentifiedLeaderStyleEnd(builder)

def serialize_fbs_identified_fcf_style(builder: flatbuffers.Builder, x: DS_IdentifiedFCFStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_feature_control_frame_style(builder, x.style)
    IdentifiedFCFStyleStart(builder)
    IdentifiedFCFStyleAddId(builder, id_offset)
    IdentifiedFCFStyleAddStyle(builder, style_offset)
    return IdentifiedFCFStyleEnd(builder)

def serialize_fbs_identified_table_style(builder: flatbuffers.Builder, x: DS_IdentifiedTableStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_table_style(builder, x.style)
    IdentifiedTableStyleStart(builder)
    IdentifiedTableStyleAddId(builder, id_offset)
    IdentifiedTableStyleAddStyle(builder, style_offset)
    return IdentifiedTableStyleEnd(builder)

def serialize_fbs_identified_doc_style(builder: flatbuffers.Builder, x: DS_IdentifiedDocStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_doc_style(builder, x.style)
    IdentifiedDocStyleStart(builder)
    IdentifiedDocStyleAddId(builder, id_offset)
    IdentifiedDocStyleAddStyle(builder, style_offset)
    return IdentifiedDocStyleEnd(builder)

def serialize_fbs_identified_viewport_style(builder: flatbuffers.Builder, x: DS_IdentifiedViewportStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_viewport_style(builder, x.style)
    IdentifiedViewportStyleStart(builder)
    IdentifiedViewportStyleAddId(builder, id_offset)
    IdentifiedViewportStyleAddStyle(builder, style_offset)
    return IdentifiedViewportStyleEnd(builder)

def serialize_fbs_identified_hatch_style(builder: flatbuffers.Builder, x: DS_IdentifiedHatchStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_duc_hatch_style(builder, x.style)
    IdentifiedHatchStyleStart(builder)
    IdentifiedHatchStyleAddId(builder, id_offset)
    IdentifiedHatchStyleAddStyle(builder, style_offset)
    return IdentifiedHatchStyleEnd(builder)

def serialize_fbs_identified_xray_style(builder: flatbuffers.Builder, x: DS_IdentifiedXRayStyle) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    style_offset = serialize_fbs_xray_style(builder, x.style)
    IdentifiedXRayStyleStart(builder)
    IdentifiedXRayStyleAddId(builder, id_offset)
    IdentifiedXRayStyleAddStyle(builder, style_offset)
    return IdentifiedXRayStyleEnd(builder)

def serialize_fbs_standard_styles(builder: flatbuffers.Builder, s: Optional[DS_StandardStyles]) -> int:
    if s is None:
        return 0
    common_offsets = [serialize_fbs_identified_common_style(builder, x) for x in (s.common_styles or [])]
    stack_like_offsets = [serialize_fbs_identified_stack_like_style(builder, x) for x in (s.stack_like_styles or [])]
    text_offsets = [serialize_fbs_identified_text_style(builder, x) for x in (s.text_styles or [])]
    dim_offsets = [serialize_fbs_identified_dimension_style(builder, x) for x in (s.dimension_styles or [])]
    leader_offsets = [serialize_fbs_identified_leader_style(builder, x) for x in (s.leader_styles or [])]
    fcf_offsets = [serialize_fbs_identified_fcf_style(builder, x) for x in (s.feature_control_frame_styles or [])]
    table_offsets = [serialize_fbs_identified_table_style(builder, x) for x in (s.table_styles or [])]
    doc_offsets = [serialize_fbs_identified_doc_style(builder, x) for x in (s.doc_styles or [])]
    viewport_offsets = [serialize_fbs_identified_viewport_style(builder, x) for x in (s.viewport_styles or [])]
    hatch_offsets = [serialize_fbs_identified_hatch_style(builder, x) for x in (s.hatch_styles or [])]
    xray_offsets = [serialize_fbs_identified_xray_style(builder, x) for x in (s.xray_styles or [])]

    # Create vectors
    def _vec(start_fn, offsets):
        if offsets is None:
            return 0
        start_fn(builder, len(offsets))
        for off in reversed(offsets):
            builder.PrependUOffsetTRelative(off)
        return builder.EndVector()

    common_vec = _vec(StandardStylesStartCommonStylesVector, common_offsets)
    stack_like_vec = _vec(StandardStylesStartStackLikeStylesVector, stack_like_offsets)
    text_vec = _vec(StandardStylesStartTextStylesVector, text_offsets)
    dim_vec = _vec(StandardStylesStartDimensionStylesVector, dim_offsets)
    leader_vec = _vec(StandardStylesStartLeaderStylesVector, leader_offsets)
    fcf_vec = _vec(StandardStylesStartFeatureControlFrameStylesVector, fcf_offsets)
    table_vec = _vec(StandardStylesStartTableStylesVector, table_offsets)
    doc_vec = _vec(StandardStylesStartDocStylesVector, doc_offsets)
    viewport_vec = _vec(StandardStylesStartViewportStylesVector, viewport_offsets)
    hatch_vec = _vec(StandardStylesStartHatchStylesVector, hatch_offsets)
    xray_vec = _vec(StandardStylesStartXrayStylesVector, xray_offsets)

    StandardStylesStart(builder)
    if common_vec: StandardStylesAddCommonStyles(builder, common_vec)
    if stack_like_vec: StandardStylesAddStackLikeStyles(builder, stack_like_vec)
    if text_vec: StandardStylesAddTextStyles(builder, text_vec)
    if dim_vec: StandardStylesAddDimensionStyles(builder, dim_vec)
    if leader_vec: StandardStylesAddLeaderStyles(builder, leader_vec)
    if fcf_vec: StandardStylesAddFeatureControlFrameStyles(builder, fcf_vec)
    if table_vec: StandardStylesAddTableStyles(builder, table_vec)
    if doc_vec: StandardStylesAddDocStyles(builder, doc_vec)
    if viewport_vec: StandardStylesAddViewportStyles(builder, viewport_vec)
    if hatch_vec: StandardStylesAddHatchStyles(builder, hatch_vec)
    if xray_vec: StandardStylesAddXrayStyles(builder, xray_vec)
    return StandardStylesEnd(builder)

# -----------------------------------------------------------------------------
# Standards: View settings
# -----------------------------------------------------------------------------

def serialize_fbs_grid_style(builder: flatbuffers.Builder, s: DS_GridStyle) -> int:
    color_offset = builder.CreateString(s.color)
    dash_vec = 0
    if s.dash_pattern:
        GridStyleStartDashPatternVector(builder, len(s.dash_pattern))
        for v in reversed(s.dash_pattern):
            builder.PrependFloat64(v)
        dash_vec = builder.EndVector()
    GridStyleStart(builder)
    GridStyleAddColor(builder, color_offset)
    GridStyleAddOpacity(builder, s.opacity)
    if dash_vec:
        GridStyleAddDashPattern(builder, dash_vec)
    return GridStyleEnd(builder)

def serialize_fbs_polar_grid_settings(builder: flatbuffers.Builder, p: Optional[DS_PolarGridSettings]) -> int:
    if p is None:
        return 0
    PolarGridSettingsStart(builder)
    PolarGridSettingsAddRadialDivisions(builder, p.radial_divisions)
    PolarGridSettingsAddRadialSpacing(builder, p.radial_spacing)
    PolarGridSettingsAddShowLabels(builder, p.show_labels)
    return PolarGridSettingsEnd(builder)

def serialize_fbs_isometric_grid_settings(builder: flatbuffers.Builder, i: Optional[DS_IsometricGridSettings]) -> int:
    if i is None:
        return 0
    IsometricGridSettingsStart(builder)
    IsometricGridSettingsAddLeftAngle(builder, i.left_angle)
    IsometricGridSettingsAddRightAngle(builder, i.right_angle)
    return IsometricGridSettingsEnd(builder)

from ducpy.classes.ElementsClass import DucUcs as DS_DucUcs
def serialize_fbs_duc_ucs(builder: flatbuffers.Builder, u: "DS_DucUcs") -> int:
    # u.origin is GeometricPoint struct
    DucUcsStart(builder)
    if u.origin:
        DucUcsAddOrigin(builder, CreateGeometricPoint(builder, u.origin.x, u.origin.y))
    DucUcsAddAngle(builder, u.angle)
    return DucUcsEnd(builder)

def serialize_fbs_grid_settings(builder: flatbuffers.Builder, s: DS_GridSettings) -> int:
    # Handle optional fields first (tables)
    major_style_offset = serialize_fbs_grid_style(builder, s.major_style) if s.major_style else 0
    minor_style_offset = serialize_fbs_grid_style(builder, s.minor_style) if s.minor_style else 0
    polar_settings_offset = serialize_fbs_polar_grid_settings(builder, s.polar_settings) if s.polar_settings else 0
    isometric_settings_offset = serialize_fbs_isometric_grid_settings(builder, s.isometric_settings) if s.isometric_settings else 0

    # Start the GridSettings table first
    GridSettingsStart(builder)
    if s.type is not None: GridSettingsAddType(builder, s.type)
    GridSettingsAddReadonly(builder, s.readonly)
    if s.display_type is not None: GridSettingsAddDisplayType(builder, s.display_type)
    GridSettingsAddIsAdaptive(builder, s.is_adaptive)
    GridSettingsAddXSpacing(builder, s.x_spacing)
    GridSettingsAddYSpacing(builder, s.y_spacing)
    GridSettingsAddSubdivisions(builder, s.subdivisions)
    # Create the GeometricPoint struct for origin (must be created right before adding)
    if s.origin:
        origin_struct = CreateGeometricPoint(builder, s.origin.x, s.origin.y)
        GridSettingsAddOrigin(builder, origin_struct)
    GridSettingsAddRotation(builder, s.rotation)
    GridSettingsAddFollowUcs(builder, s.follow_ucs)
    if major_style_offset: GridSettingsAddMajorStyle(builder, major_style_offset)
    if minor_style_offset: GridSettingsAddMinorStyle(builder, minor_style_offset)
    GridSettingsAddShowMinor(builder, s.show_minor)
    GridSettingsAddMinZoom(builder, s.min_zoom)
    GridSettingsAddMaxZoom(builder, s.max_zoom)
    GridSettingsAddAutoHide(builder, s.auto_hide)
    if polar_settings_offset: GridSettingsAddPolarSettings(builder, polar_settings_offset)
    if isometric_settings_offset: GridSettingsAddIsometricSettings(builder, isometric_settings_offset)
    GridSettingsAddEnableSnapping(builder, s.enable_snapping)
    return GridSettingsEnd(builder)

def serialize_fbs_snap_override(builder: flatbuffers.Builder, o: DS_SnapOverride) -> int:
    key_offset = builder.CreateString(o.key)
    SnapOverrideStart(builder)
    SnapOverrideAddKey(builder, key_offset)
    if o.behavior is not None:
        SnapOverrideAddBehavior(builder, o.behavior)
    return SnapOverrideEnd(builder)

def serialize_fbs_dynamic_snap_settings(builder: flatbuffers.Builder, s: DS_DynamicSnapSettings) -> int:
    DynamicSnapSettingsStart(builder)
    DynamicSnapSettingsAddEnabledDuringDrag(builder, s.enabled_during_drag)
    DynamicSnapSettingsAddEnabledDuringRotation(builder, s.enabled_during_rotation)
    DynamicSnapSettingsAddEnabledDuringScale(builder, s.enabled_during_scale)
    return DynamicSnapSettingsEnd(builder)

def serialize_fbs_tracking_line_style(builder: flatbuffers.Builder, s: Optional[DS_TrackingLineStyle]) -> int:
    if s is None:
        return 0
    color_offset = builder.CreateString(s.color)
    dash_vec = 0
    if s.dash_pattern:
        TrackingLineStyleStartDashPatternVector(builder, len(s.dash_pattern))
        for v in reversed(s.dash_pattern):
            builder.PrependFloat64(v)
        dash_vec = builder.EndVector()
    TrackingLineStyleStart(builder)
    TrackingLineStyleAddColor(builder, color_offset)
    TrackingLineStyleAddOpacity(builder, s.opacity)
    if dash_vec: TrackingLineStyleAddDashPattern(builder, dash_vec)
    return TrackingLineStyleEnd(builder)

def serialize_fbs_polar_tracking_settings(builder: flatbuffers.Builder, s: DS_PolarTrackingSettings) -> int:
    angles_vec = 0
    if s.angles:
        PolarTrackingSettingsStartAnglesVector(builder, len(s.angles))
        for a in reversed(s.angles):
            builder.PrependFloat64(a)
        angles_vec = builder.EndVector()
    PolarTrackingSettingsStart(builder)
    PolarTrackingSettingsAddEnabled(builder, s.enabled)
    if angles_vec: PolarTrackingSettingsAddAngles(builder, angles_vec)
    if s.increment_angle is not None:
        PolarTrackingSettingsAddIncrementAngle(builder, s.increment_angle)
    PolarTrackingSettingsAddTrackFromLastPoint(builder, s.track_from_last_point)
    PolarTrackingSettingsAddShowPolarCoordinates(builder, s.show_polar_coordinates)
    return PolarTrackingSettingsEnd(builder)

def serialize_fbs_layer_snap_filters(builder: flatbuffers.Builder, f: Optional[DS_LayerSnapFilters]) -> int:
    if f is None:
        return 0
    include_vec = 0
    if f.include_layers:
        LayerSnapFiltersStartIncludeLayersVector(builder, len(f.include_layers))
        for s in reversed(f.include_layers):
            builder.PrependUOffsetTRelative(builder.CreateString(s))
        include_vec = builder.EndVector()
    exclude_vec = 0
    if f.exclude_layers:
        LayerSnapFiltersStartExcludeLayersVector(builder, len(f.exclude_layers))
        for s in reversed(f.exclude_layers):
            builder.PrependUOffsetTRelative(builder.CreateString(s))
        exclude_vec = builder.EndVector()
    LayerSnapFiltersStart(builder)
    if include_vec: LayerSnapFiltersAddIncludeLayers(builder, include_vec)
    if exclude_vec: LayerSnapFiltersAddExcludeLayers(builder, exclude_vec)
    return LayerSnapFiltersEnd(builder)

def serialize_fbs_snap_marker_style(builder: flatbuffers.Builder, s: DS_SnapMarkerStyle) -> int:
    color_offset = builder.CreateString(s.color)
    SnapMarkerStyleStart(builder)
    if s.shape is not None: SnapMarkerStyleAddShape(builder, s.shape)
    SnapMarkerStyleAddColor(builder, color_offset)
    return SnapMarkerStyleEnd(builder)

def serialize_fbs_snap_marker_style_entry(builder: flatbuffers.Builder, e: DS_SnapMarkerStyleEntry) -> int:
    value_offset = serialize_fbs_snap_marker_style(builder, e.value)
    SnapMarkerStyleEntryStart(builder)
    if e.key is not None:
        SnapMarkerStyleEntryAddKey(builder, e.key)
    SnapMarkerStyleEntryAddValue(builder, value_offset)
    return SnapMarkerStyleEntryEnd(builder)

def serialize_fbs_snap_marker_settings(builder: flatbuffers.Builder, s: DS_SnapMarkerSettings) -> int:
    styles_offsets = [serialize_fbs_snap_marker_style_entry(builder, it) for it in (s.styles or [])]
    styles_vec = 0
    if styles_offsets:
        SnapMarkerSettingsStartStylesVector(builder, len(styles_offsets))
        for off in reversed(styles_offsets):
            builder.PrependUOffsetTRelative(off)
        styles_vec = builder.EndVector()
    SnapMarkerSettingsStart(builder)
    SnapMarkerSettingsAddEnabled(builder, s.enabled)
    SnapMarkerSettingsAddSize(builder, s.size)
    if s.duration is not None:
        SnapMarkerSettingsAddDuration(builder, s.duration)
    if styles_vec:
        SnapMarkerSettingsAddStyles(builder, styles_vec)
    return SnapMarkerSettingsEnd(builder)

def serialize_fbs_snap_settings(builder: flatbuffers.Builder, s: DS_SnapSettings) -> int:
    polar_tracking_offset = serialize_fbs_polar_tracking_settings(builder, s.polar_tracking)
    dynamic_snap_offset = serialize_fbs_dynamic_snap_settings(builder, s.dynamic_snap)
    tracking_line_style_offset = serialize_fbs_tracking_line_style(builder, s.tracking_line_style)
    snap_markers_offset = serialize_fbs_snap_marker_settings(builder, s.snap_markers)
    layer_filters_offset = serialize_fbs_layer_snap_filters(builder, s.layer_snap_filters)

    active_modes_vec = 0
    if s.active_object_snap_modes:
        SnapSettingsStartActiveObjectSnapModesVector(builder, len(s.active_object_snap_modes))
        for m in reversed(s.active_object_snap_modes):
            builder.PrependUint8(m)
        active_modes_vec = builder.EndVector()

    priority_vec = 0
    if s.snap_priority:
        SnapSettingsStartSnapPriorityVector(builder, len(s.snap_priority))
        for m in reversed(s.snap_priority):
            builder.PrependUint8(m)
        priority_vec = builder.EndVector()

    overrides_vec = 0
    if s.temporary_overrides:
        SnapSettingsStartTemporaryOverridesVector(builder, len(s.temporary_overrides))
        for ov in reversed(s.temporary_overrides):
            builder.PrependUOffsetTRelative(serialize_fbs_snap_override(builder, ov))
        overrides_vec = builder.EndVector()

    eltype_vec = 0
    if s.element_type_filters:
        SnapSettingsStartElementTypeFiltersVector(builder, len(s.element_type_filters))
        for t in reversed(s.element_type_filters):
            builder.PrependUOffsetTRelative(builder.CreateString(t))
        eltype_vec = builder.EndVector()

    SnapSettingsStart(builder)
    SnapSettingsAddReadonly(builder, s.readonly)
    SnapSettingsAddTwistAngle(builder, s.twist_angle)
    SnapSettingsAddSnapTolerance(builder, s.snap_tolerance)
    SnapSettingsAddObjectSnapAperture(builder, s.object_snap_aperture)
    SnapSettingsAddIsOrthoModeOn(builder, s.is_ortho_mode_on)
    SnapSettingsAddPolarTracking(builder, polar_tracking_offset)
    SnapSettingsAddIsObjectSnapOn(builder, s.is_object_snap_on)
    if active_modes_vec: SnapSettingsAddActiveObjectSnapModes(builder, active_modes_vec)
    if priority_vec: SnapSettingsAddSnapPriority(builder, priority_vec)
    SnapSettingsAddShowTrackingLines(builder, s.show_tracking_lines)
    if tracking_line_style_offset: SnapSettingsAddTrackingLineStyle(builder, tracking_line_style_offset)
    SnapSettingsAddDynamicSnap(builder, dynamic_snap_offset)
    if overrides_vec: SnapSettingsAddTemporaryOverrides(builder, overrides_vec)
    if s.incremental_distance is not None:
        SnapSettingsAddIncrementalDistance(builder, s.incremental_distance)
    if s.magnetic_strength is not None:
        SnapSettingsAddMagneticStrength(builder, s.magnetic_strength)
    if layer_filters_offset: SnapSettingsAddLayerSnapFilters(builder, layer_filters_offset)
    if eltype_vec: SnapSettingsAddElementTypeFilters(builder, eltype_vec)
    if s.snap_mode is not None:
        SnapSettingsAddSnapMode(builder, s.snap_mode)
    if snap_markers_offset: SnapSettingsAddSnapMarkers(builder, snap_markers_offset)
    SnapSettingsAddConstructionSnapEnabled(builder, s.construction_snap_enabled)
    if s.snap_to_grid_intersections is not None:
        SnapSettingsAddSnapToGridIntersections(builder, s.snap_to_grid_intersections)
    return SnapSettingsEnd(builder)

def serialize_fbs_identified_grid_settings(builder: flatbuffers.Builder, x: DS_IdentifiedGridSettings) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    settings_offset = serialize_fbs_grid_settings(builder, x.settings)
    IdentifiedGridSettingsStart(builder)
    IdentifiedGridSettingsAddId(builder, id_offset)
    IdentifiedGridSettingsAddSettings(builder, settings_offset)
    return IdentifiedGridSettingsEnd(builder)

def serialize_fbs_identified_snap_settings(builder: flatbuffers.Builder, x: DS_IdentifiedSnapSettings) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    settings_offset = serialize_fbs_snap_settings(builder, x.settings)
    IdentifiedSnapSettingsStart(builder)
    IdentifiedSnapSettingsAddId(builder, id_offset)
    IdentifiedSnapSettingsAddSettings(builder, settings_offset)
    return IdentifiedSnapSettingsEnd(builder)

def serialize_fbs_identified_ucs(builder: flatbuffers.Builder, x: DS_IdentifiedUcs) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    ucs_offset = serialize_fbs_duc_ucs(builder, x.ucs)
    IdentifiedUcsStart(builder)
    IdentifiedUcsAddId(builder, id_offset)
    IdentifiedUcsAddUcs(builder, ucs_offset)
    return IdentifiedUcsEnd(builder)

def serialize_fbs_identified_view(builder: flatbuffers.Builder, x: DS_IdentifiedView) -> int:
    id_offset = serialize_fbs_identifier(builder, x.id)
    view_offset = serialize_fbs_duc_view(builder, x.view)
    IdentifiedViewStart(builder)
    IdentifiedViewAddId(builder, id_offset)
    IdentifiedViewAddView(builder, view_offset)
    return IdentifiedViewEnd(builder)

def serialize_fbs_standard_view_settings(builder: flatbuffers.Builder, s: Optional[DS_StandardViewSettings]) -> int:
    if s is None:
        return 0
    views_offsets = [serialize_fbs_identified_view(builder, v) for v in (s.views or [])]
    ucs_offsets = [serialize_fbs_identified_ucs(builder, u) for u in (s.ucs or [])]
    grid_offsets = [serialize_fbs_identified_grid_settings(builder, g) for g in (s.grid_settings or [])]
    snap_offsets = [serialize_fbs_identified_snap_settings(builder, sn) for sn in (s.snap_settings or [])]

    def _vec(start_fn, offsets):
        start_fn(builder, len(offsets))
        for off in reversed(offsets):
            builder.PrependUOffsetTRelative(off)
        return builder.EndVector()

    views_vec = _vec(StandardViewSettingsStartViewsVector, views_offsets) if views_offsets else 0
    ucs_vec = _vec(StandardViewSettingsStartUcsVector, ucs_offsets) if ucs_offsets else 0
    grid_vec = _vec(StandardViewSettingsStartGridSettingsVector, grid_offsets) if grid_offsets else 0
    snap_vec = _vec(StandardViewSettingsStartSnapSettingsVector, snap_offsets) if snap_offsets else 0

    StandardViewSettingsStart(builder)
    if views_vec: StandardViewSettingsAddViews(builder, views_vec)
    if ucs_vec: StandardViewSettingsAddUcs(builder, ucs_vec)
    if grid_vec: StandardViewSettingsAddGridSettings(builder, grid_vec)
    if snap_vec: StandardViewSettingsAddSnapSettings(builder, snap_vec)
    return StandardViewSettingsEnd(builder)

# -----------------------------------------------------------------------------
# Standards: Validation
# -----------------------------------------------------------------------------

def serialize_fbs_dimension_validation_rules(builder: flatbuffers.Builder, r: Optional[DS_DimensionValidationRules]) -> int:
    if r is None:
        return 0
    allowed_vec = 0
    if r.allowed_precisions:
        DimensionValidationRulesStartAllowedPrecisionsVector(builder, len(r.allowed_precisions))
        for p in reversed(r.allowed_precisions):
            builder.PrependInt32(p)
        allowed_vec = builder.EndVector()
    DimensionValidationRulesStart(builder)
    DimensionValidationRulesAddMinTextHeight(builder, r.min_text_height)
    DimensionValidationRulesAddMaxTextHeight(builder, r.max_text_height)
    if allowed_vec:
        DimensionValidationRulesAddAllowedPrecisions(builder, allowed_vec)
    return DimensionValidationRulesEnd(builder)

def serialize_fbs_layer_validation_rules(builder: flatbuffers.Builder, r: Optional[DS_LayerValidationRules]) -> int:
    if r is None:
        return 0
    names_vec = 0
    if r.prohibited_layer_names:
        # Create all strings first
        string_offsets = [builder.CreateString(n) for n in r.prohibited_layer_names]
        LayerValidationRulesStartProhibitedLayerNamesVector(builder, len(string_offsets))
        for off in reversed(string_offsets):
            builder.PrependUOffsetTRelative(off)
        names_vec = builder.EndVector()
    LayerValidationRulesStart(builder)
    if names_vec:
        LayerValidationRulesAddProhibitedLayerNames(builder, names_vec)
    return LayerValidationRulesEnd(builder)

def serialize_fbs_standard_validation(builder: flatbuffers.Builder, v: Optional[DS_StandardValidation]) -> int:
    if v is None:
        return 0
    dim_offset = serialize_fbs_dimension_validation_rules(builder, v.dimension_rules)
    layer_offset = serialize_fbs_layer_validation_rules(builder, v.layer_rules)
    StandardValidationStart(builder)
    if dim_offset: StandardValidationAddDimensionRules(builder, dim_offset)
    if layer_offset: StandardValidationAddLayerRules(builder, layer_offset)
    return StandardValidationEnd(builder)

# -----------------------------------------------------------------------------
# Standard (all)
# -----------------------------------------------------------------------------

def serialize_fbs_standard(builder: flatbuffers.Builder, s: DS_Standard) -> int:
    identifier_offset = serialize_fbs_identifier(builder, s.identifier)
    version_offset = builder.CreateString(s.version)
    overrides_offset = serialize_fbs_standard_overrides(builder, s.overrides)
    styles_offset = serialize_fbs_standard_styles(builder, s.styles)
    view_settings_offset = serialize_fbs_standard_view_settings(builder, s.view_settings)
    units_offset = serialize_fbs_standard_units(builder, s.units)
    validation_offset = serialize_fbs_standard_validation(builder, s.validation)

    StandardStart(builder)
    StandardAddIdentifier(builder, identifier_offset)
    StandardAddVersion(builder, version_offset)
    StandardAddReadonly(builder, s.readonly)
    if overrides_offset: StandardAddOverrides(builder, overrides_offset)
    if styles_offset: StandardAddStyles(builder, styles_offset)
    if view_settings_offset: StandardAddViewSettings(builder, view_settings_offset)
    if units_offset: StandardAddUnits(builder, units_offset)
    if validation_offset: StandardAddValidation(builder, validation_offset)
    return StandardEnd(builder)

# -----------------------------------------------------------------------------
# Blocks, Groups, Regions, Layers
# -----------------------------------------------------------------------------

def serialize_fbs_block_attribute_definition(builder: flatbuffers.Builder, d: "DS_DucBlockAttributeDefinition") -> int:
    tag_offset = builder.CreateString(d.tag)
    prompt_offset = _str(builder, d.prompt)
    default_value_offset = builder.CreateString(d.default_value)
    DucBlockAttributeDefinitionStart(builder)
    DucBlockAttributeDefinitionAddTag(builder, tag_offset)
    if prompt_offset: DucBlockAttributeDefinitionAddPrompt(builder, prompt_offset)
    DucBlockAttributeDefinitionAddDefaultValue(builder, default_value_offset)
    DucBlockAttributeDefinitionAddIsConstant(builder, d.is_constant)
    return DucBlockAttributeDefinitionEnd(builder)

def serialize_fbs_block_attribute_definition_entry(builder: flatbuffers.Builder, e: DS_DucBlockAttributeDefinitionEntry) -> int:
    key_offset = builder.CreateString(e.key)
    value_offset = serialize_fbs_block_attribute_definition(builder, e.value)
    DucBlockAttributeDefinitionEntryStart(builder)
    DucBlockAttributeDefinitionEntryAddKey(builder, key_offset)
    DucBlockAttributeDefinitionEntryAddValue(builder, value_offset)
    return DucBlockAttributeDefinitionEntryEnd(builder)

def serialize_fbs_block(builder: flatbuffers.Builder, block: DS_DucBlock) -> int:
    id_offset = builder.CreateString(block.id)
    label_offset = builder.CreateString(block.label)
    description_offset = _str(builder, block.description)
    elements_offsets = [serialize_fbs_element_wrapper(builder, e) for e in (block.elements or [])]
    DucBlockStartElementsVector(builder, len(elements_offsets))
    for off in reversed(elements_offsets):
        builder.PrependUOffsetTRelative(off)
    elements_vec = builder.EndVector()

    attr_offsets = [serialize_fbs_block_attribute_definition_entry(builder, a) for a in (block.attribute_definitions or [])]
    attr_vec = 0
    if attr_offsets:
        DucBlockStartAttributeDefinitionsVector(builder, len(attr_offsets))
        for off in reversed(attr_offsets):
            builder.PrependUOffsetTRelative(off)
        attr_vec = builder.EndVector()

    DucBlockStart(builder)
    DucBlockAddId(builder, id_offset)
    DucBlockAddLabel(builder, label_offset)
    if description_offset:
        DucBlockAddDescription(builder, description_offset)
    DucBlockAddVersion(builder, block.version)
    DucBlockAddElements(builder, elements_vec)
    if attr_vec:
        DucBlockAddAttributeDefinitions(builder, attr_vec)
    return DucBlockEnd(builder)

def serialize_fbs_group(builder: flatbuffers.Builder, group: DS_DucGroup) -> int:
    id_offset = builder.CreateString(group.id)
    stack_base_offset = serialize_fbs_duc_stack_base(builder, group.stack_base)
    DucGroupStart(builder)
    DucGroupAddId(builder, id_offset)
    DucGroupAddStackBase(builder, stack_base_offset)
    return DucGroupEnd(builder)

def serialize_fbs_region(builder: flatbuffers.Builder, region: DS_DucRegion) -> int:
    id_offset = builder.CreateString(region.id)
    stack_base_offset = serialize_fbs_duc_stack_base(builder, region.stack_base)
    DucRegionStart(builder)
    DucRegionAddId(builder, id_offset)
    DucRegionAddStackBase(builder, stack_base_offset)
    if region.boolean_operation is not None:
        DucRegionAddBooleanOperation(builder, region.boolean_operation)
    return DucRegionEnd(builder)

def serialize_fbs_layer_overrides(builder: flatbuffers.Builder, o: DS_DucLayerOverrides) -> int:
    stroke_offset = serialize_fbs_element_stroke(builder, o.stroke)
    bg_offset = serialize_fbs_element_background(builder, o.background)
    DucLayerOverridesStart(builder)
    DucLayerOverridesAddStroke(builder, stroke_offset)
    DucLayerOverridesAddBackground(builder, bg_offset)
    return DucLayerOverridesEnd(builder)

def serialize_fbs_layer(builder: flatbuffers.Builder, layer: DS_DucLayer) -> int:
    id_offset = builder.CreateString(layer.id)
    stack_base_offset = serialize_fbs_duc_stack_base(builder, layer.stack_base)
    overrides_offset = serialize_fbs_layer_overrides(builder, layer.overrides)
    DucLayerStart(builder)
    DucLayerAddId(builder, id_offset)
    DucLayerAddStackBase(builder, stack_base_offset)
    DucLayerAddReadonly(builder, layer.readonly)
    DucLayerAddOverrides(builder, overrides_offset)
    return DucLayerEnd(builder)

# -----------------------------------------------------------------------------
# App & Document state
# -----------------------------------------------------------------------------

def serialize_fbs_duc_global_state(builder: flatbuffers.Builder, s: Optional[DS_DucGlobalState]) -> int:
    if s is None:
        return 0
    name_offset = _str(builder, s.name)
    bg_offset = builder.CreateString(s.view_background_color)
    scope_offset = builder.CreateString(s.main_scope)
    DucGlobalStateStart(builder)
    if name_offset: DucGlobalStateAddName(builder, name_offset)
    DucGlobalStateAddViewBackgroundColor(builder, bg_offset)
    DucGlobalStateAddMainScope(builder, scope_offset)
    DucGlobalStateAddDashSpacingScale(builder, s.dash_spacing_scale)
    DucGlobalStateAddIsDashSpacingAffectedByViewportScale(builder, s.is_dash_spacing_affected_by_viewport_scale)
    DucGlobalStateAddScopeExponentThreshold(builder, s.scope_exponent_threshold)
    DucGlobalStateAddDimensionsAssociativeByDefault(builder, s.dimensions_associative_by_default)
    DucGlobalStateAddUseAnnotativeScaling(builder, s.use_annotative_scaling)
    if s.display_precision:
        DucGlobalStateAddDisplayPrecisionLinear(builder, s.display_precision.linear)
        DucGlobalStateAddDisplayPrecisionAngular(builder, s.display_precision.angular)
    return DucGlobalStateEnd(builder)

def serialize_fbs_duc_local_state(builder: flatbuffers.Builder, s: Optional[DS_DucLocalState]) -> int:
    if s is None:
        return 0
    scope_offset = builder.CreateString(s.scope)
    active_standard_id_offset = builder.CreateString(s.active_standard_id)
    active_grid_vec = 0
    if s.active_grid_settings:
        DucLocalStateStartActiveGridSettingsVector(builder, len(s.active_grid_settings))
        for g in reversed(s.active_grid_settings):
            builder.PrependUOffsetTRelative(builder.CreateString(g))
        active_grid_vec = builder.EndVector()
    active_snap_settings_offset = _str(builder, s.active_snap_settings)
    current_item_stroke_offset = serialize_fbs_element_stroke(builder, s.current_item_stroke) if s.current_item_stroke else 0
    current_item_bg_offset = serialize_fbs_element_background(builder, s.current_item_background) if s.current_item_background else 0
    current_item_font_family_offset = _str(builder, s.current_item_font_family)
    current_item_start_head_offset = serialize_fbs_duc_head(builder, s.current_item_start_line_head) if s.current_item_start_line_head else 0
    current_item_end_head_offset = serialize_fbs_duc_head(builder, s.current_item_end_line_head) if s.current_item_end_line_head else 0

    DucLocalStateStart(builder)
    DucLocalStateAddScope(builder, scope_offset)
    DucLocalStateAddActiveStandardId(builder, active_standard_id_offset)
    DucLocalStateAddScrollX(builder, s.scroll_x)
    DucLocalStateAddScrollY(builder, s.scroll_y)
    DucLocalStateAddZoom(builder, s.zoom)
    if active_grid_vec: DucLocalStateAddActiveGridSettings(builder, active_grid_vec)
    if active_snap_settings_offset: DucLocalStateAddActiveSnapSettings(builder, active_snap_settings_offset)
    DucLocalStateAddIsBindingEnabled(builder, s.is_binding_enabled)
    if current_item_stroke_offset: DucLocalStateAddCurrentItemStroke(builder, current_item_stroke_offset)
    if current_item_bg_offset: DucLocalStateAddCurrentItemBackground(builder, current_item_bg_offset)
    if s.current_item_opacity is not None: DucLocalStateAddCurrentItemOpacity(builder, s.current_item_opacity)
    if current_item_font_family_offset: DucLocalStateAddCurrentItemFontFamily(builder, current_item_font_family_offset)
    if s.current_item_font_size is not None: DucLocalStateAddCurrentItemFontSize(builder, s.current_item_font_size)
    if s.current_item_text_align is not None: DucLocalStateAddCurrentItemTextAlign(builder, s.current_item_text_align)
    if current_item_start_head_offset: DucLocalStateAddCurrentItemStartLineHead(builder, current_item_start_head_offset)
    if current_item_end_head_offset: DucLocalStateAddCurrentItemEndLineHead(builder, current_item_end_head_offset)
    if s.current_item_roundness is not None: DucLocalStateAddCurrentItemRoundness(builder, s.current_item_roundness)
    DucLocalStateAddPenMode(builder, s.pen_mode)
    DucLocalStateAddViewModeEnabled(builder, s.view_mode_enabled)
    DucLocalStateAddObjectsSnapModeEnabled(builder, s.objects_snap_mode_enabled)
    DucLocalStateAddGridModeEnabled(builder, s.grid_mode_enabled)
    DucLocalStateAddOutlineModeEnabled(builder, s.outline_mode_enabled)
    return DucLocalStateEnd(builder)

# -----------------------------------------------------------------------------
# External files
# -----------------------------------------------------------------------------

def serialize_fbs_external_file_data(builder: flatbuffers.Builder, d: DS_DucExternalFileData) -> int:
    mime_offset = builder.CreateString(d.mime_type)
    id_offset = builder.CreateString(d.id)
    data_vec = builder.CreateByteVector(d.data) if d.data else 0
    DucExternalFileDataStart(builder)
    DucExternalFileDataAddMimeType(builder, mime_offset)
    DucExternalFileDataAddId(builder, id_offset)
    if data_vec: DucExternalFileDataAddData(builder, data_vec)
    DucExternalFileDataAddCreated(builder, d.created)
    if d.last_retrieved is not None:
        DucExternalFileDataAddLastRetrieved(builder, d.last_retrieved)
    return DucExternalFileDataEnd(builder)

def serialize_fbs_external_file_entry(builder: flatbuffers.Builder, e: DS_DucExternalFileEntry) -> int:
    key_offset = builder.CreateString(e.key)
    value_offset = serialize_fbs_external_file_data(builder, e.value)
    DucExternalFileEntryStart(builder)
    DucExternalFileEntryAddKey(builder, key_offset)
    DucExternalFileEntryAddValue(builder, value_offset)
    return DucExternalFileEntryEnd(builder)

# -----------------------------------------------------------------------------
# Version graph
# -----------------------------------------------------------------------------

def serialize_fbs_version_base(builder: flatbuffers.Builder, b: DS_VersionBase) -> int:
    id_offset = builder.CreateString(b.id)
    parent_id_offset = _str(builder, b.parent_id)
    description_offset = _str(builder, b.description)
    user_id_offset = _str(builder, b.user_id)

    VersionBaseStart(builder)
    VersionBaseAddId(builder, id_offset)
    if parent_id_offset: VersionBaseAddParentId(builder, parent_id_offset)
    VersionBaseAddTimestamp(builder, b.timestamp)
    if description_offset: VersionBaseAddDescription(builder, description_offset)
    VersionBaseAddIsManualSave(builder, b.is_manual_save)
    if user_id_offset: VersionBaseAddUserId(builder, user_id_offset)
    return VersionBaseEnd(builder)

def serialize_fbs_checkpoint(builder: flatbuffers.Builder, c: DS_Checkpoint) -> int:
    base_offset = serialize_fbs_version_base(builder, c)
    data_vec = builder.CreateByteVector(c.data) if c.data else 0
    CheckpointStart(builder)
    CheckpointAddBase(builder, base_offset)
    if data_vec: CheckpointAddData(builder, data_vec)
    CheckpointAddSizeBytes(builder, c.size_bytes)
    return CheckpointEnd(builder)

def serialize_fbs_json_patch_operation(builder: flatbuffers.Builder, op: DS_JSONPatchOperation) -> int:
    op_offset = builder.CreateString(op.op)
    path_offset = builder.CreateString(op.path)
    from_offset = _str(builder, op.from_path)  # mapped from 'from_path' to 'from' in schema
    value_json = json.dumps(op.value) if not isinstance(op.value, str) else op.value
    value_offset = builder.CreateString(value_json)
    JSONPatchOperationStart(builder)
    JSONPatchOperationAddOp(builder, op_offset)
    JSONPatchOperationAddPath(builder, path_offset)
    if from_offset: JSONPatchOperationAddFrom(builder, from_offset)
    JSONPatchOperationAddValue(builder, value_offset)
    return JSONPatchOperationEnd(builder)

def serialize_fbs_delta(builder: flatbuffers.Builder, d: DS_Delta) -> int:
    base_offset = serialize_fbs_version_base(builder, d)
    patch_offsets = [serialize_fbs_json_patch_operation(builder, p) for p in (d.patch or [])]
    DeltaStartPatchVector(builder, len(patch_offsets))
    for off in reversed(patch_offsets):
        builder.PrependUOffsetTRelative(off)
    patch_vec = builder.EndVector()
    DeltaStart(builder)
    DeltaAddBase(builder, base_offset)
    DeltaAddPatch(builder, patch_vec)
    return DeltaEnd(builder)

def serialize_fbs_version_graph_metadata(builder: flatbuffers.Builder, m: Optional[DS_VersionGraphMetadata]) -> int:
    if m is None:
        return 0
    VersionGraphMetadataStart(builder)
    if m.pruning_level is not None:
        VersionGraphMetadataAddPruningLevel(builder, m.pruning_level)
    VersionGraphMetadataAddLastPruned(builder, m.last_pruned)
    VersionGraphMetadataAddTotalSize(builder, m.total_size)
    return VersionGraphMetadataEnd(builder)

def serialize_fbs_version_graph(builder: flatbuffers.Builder, g: Optional[DS_VersionGraph]) -> int:
    if g is None:
        return 0
    checkpoints_offsets = [serialize_fbs_checkpoint(builder, c) for c in (g.checkpoints or [])]
    VersionGraphStartCheckpointsVector(builder, len(checkpoints_offsets))
    for off in reversed(checkpoints_offsets):
        builder.PrependUOffsetTRelative(off)
    checkpoints_vec = builder.EndVector()

    deltas_offsets = [serialize_fbs_delta(builder, d) for d in (g.deltas or [])]
    VersionGraphStartDeltasVector(builder, len(deltas_offsets))
    for off in reversed(deltas_offsets):
        builder.PrependUOffsetTRelative(off)
    deltas_vec = builder.EndVector()

    metadata_offset = serialize_fbs_version_graph_metadata(builder, g.metadata)
    user_chk_offset = builder.CreateString(g.user_checkpoint_version_id) if g.user_checkpoint_version_id else 0
    latest_offset = builder.CreateString(g.latest_version_id) if g.latest_version_id else 0

    VersionGraphStart(builder)
    if user_chk_offset: VersionGraphAddUserCheckpointVersionId(builder, user_chk_offset)
    if latest_offset: VersionGraphAddLatestVersionId(builder, latest_offset)
    VersionGraphAddCheckpoints(builder, checkpoints_vec)
    VersionGraphAddDeltas(builder, deltas_vec)
    if metadata_offset: VersionGraphAddMetadata(builder, metadata_offset)
    return VersionGraphEnd(builder)

# -----------------------------------------------------------------------------
# Root assembly
# -----------------------------------------------------------------------------

def serialize_as_flatbuffers(data_state: DS_ExportedDataState) -> bytes:
    """
    Serialize ExportedDataState to FlatBuffers using comprehensive classes.
    """
    try:
        builder = flatbuffers.Builder(1024 * 1024)

        # Elements
        elements_offsets = [serialize_fbs_element_wrapper(builder, ew) for ew in (data_state.elements or [])]
        ExportedDataStateStartElementsVector(builder, len(elements_offsets))
        for off in reversed(elements_offsets):
            builder.PrependUOffsetTRelative(off)
        elements_vec = builder.EndVector()

        # Blocks
        blocks_offsets = [serialize_fbs_block(builder, b) for b in (data_state.blocks or [])]
        ExportedDataStateStartBlocksVector(builder, len(blocks_offsets))
        for off in reversed(blocks_offsets):
            builder.PrependUOffsetTRelative(off)
        blocks_vec = builder.EndVector()

        # Groups
        groups_offsets = [serialize_fbs_group(builder, g) for g in (data_state.groups or [])]
        ExportedDataStateStartGroupsVector(builder, len(groups_offsets))
        for off in reversed(groups_offsets):
            builder.PrependUOffsetTRelative(off)
        groups_vec = builder.EndVector()

        # Regions
        regions_offsets = [serialize_fbs_region(builder, r) for r in (data_state.regions or [])]
        ExportedDataStateStartRegionsVector(builder, len(regions_offsets))
        for off in reversed(regions_offsets):
            builder.PrependUOffsetTRelative(off)
        regions_vec = builder.EndVector()

        # Layers
        layers_offsets = [serialize_fbs_layer(builder, l) for l in (data_state.layers or [])]
        ExportedDataStateStartLayersVector(builder, len(layers_offsets))
        for off in reversed(layers_offsets):
            builder.PrependUOffsetTRelative(off)
        layers_vec = builder.EndVector()

        # Standards
        standards_offsets = [serialize_fbs_standard(builder, s) for s in (data_state.standards or [])]
        ExportedDataStateStartStandardsVector(builder, len(standards_offsets))
        for off in reversed(standards_offsets):
            builder.PrependUOffsetTRelative(off)
        standards_vec = builder.EndVector()

        # States
        duc_local_state_offset = serialize_fbs_duc_local_state(builder, data_state.duc_local_state)
        duc_global_state_offset = serialize_fbs_duc_global_state(builder, data_state.duc_global_state)

        # External files
        files_offsets = [serialize_fbs_external_file_entry(builder, f) for f in (data_state.files or [])]
        ExportedDataStateStartExternalFilesVector(builder, len(files_offsets))
        for off in reversed(files_offsets):
            builder.PrependUOffsetTRelative(off)
        files_vec = builder.EndVector()

        # Version graph
        version_graph_offset = serialize_fbs_version_graph(builder, data_state.version_graph)

        # Dictionary
        dict_items = list((data_state.dictionary or {}).items())
        dict_offsets = []
        for k, v in dict_items:
            dict_offsets.append(serialize_fbs_dictionary_entry(builder, DS_DictionaryEntry(k, v)))
        ExportedDataStateStartDictionaryVector(builder, len(dict_offsets))
        for off in reversed(dict_offsets):
            builder.PrependUOffsetTRelative(off)
        dictionary_vec = builder.EndVector()

        # Strings and thumbnail
        type_offset = builder.CreateString(data_state.type)
        version_offset = builder.CreateString(data_state.version)
        source_offset = builder.CreateString(data_state.source)
        thumbnail_offset = builder.CreateByteVector(data_state.thumbnail) if data_state.thumbnail else 0

        # Build root
        ExportedDataStateStart(builder)
        ExportedDataStateAddType(builder, type_offset)
        # Schema contains version_legacy, default to 0
        from ducpy.Duc.ExportedDataState import ExportedDataStateAddVersionLegacy
        ExportedDataStateAddVersionLegacy(builder, 0)
        ExportedDataStateAddSource(builder, source_offset)
        ExportedDataStateAddVersion(builder, version_offset)
        if thumbnail_offset: ExportedDataStateAddThumbnail(builder, thumbnail_offset)
        ExportedDataStateAddDictionary(builder, dictionary_vec)
        ExportedDataStateAddElements(builder, elements_vec)
        ExportedDataStateAddBlocks(builder, blocks_vec)
        ExportedDataStateAddGroups(builder, groups_vec)
        ExportedDataStateAddRegions(builder, regions_vec)
        ExportedDataStateAddLayers(builder, layers_vec)
        ExportedDataStateAddStandards(builder, standards_vec)
        if duc_local_state_offset: ExportedDataStateAddDucLocalState(builder, duc_local_state_offset)
        if duc_global_state_offset: ExportedDataStateAddDucGlobalState(builder, duc_global_state_offset)
        ExportedDataStateAddExternalFiles(builder, files_vec)
        if version_graph_offset: ExportedDataStateAddVersionGraph(builder, version_graph_offset)
        exported_data = ExportedDataStateEnd(builder)

        builder.Finish(exported_data, b"DUC_")
        return builder.Output()
    except Exception as e:
        logger.error(f"Serialization failed with error: {str(e)}", exc_info=True)
        raise

# -----------------------------------------------------------------------------
# User-friendly API
# -----------------------------------------------------------------------------

def serialize_duc(
  name: str,
  thumbnail: bytes = None,
  dictionary: List[DS_DictionaryEntry] = None,
  elements: List[DS_ElementWrapper] = None,
  duc_local_state: DS_DucLocalState = None,
  duc_global_state: DS_DucGlobalState = None,
  version_graph: DS_VersionGraph = None,
  blocks: List[DS_DucBlock] = None,
  groups: List[DS_DucGroup] = None,
  regions: List[DS_DucRegion] = None,
  layers: List[DS_DucLayer] = None,
  external_files: List[DS_DucExternalFileEntry] = None,
  standards: List[DS_Standard] = None,
) -> bytes:
    """
    Serialize elements to DUC format with a user-friendly API.
    """
    try:
        dict_map: Dict[str, str] = {e.key: e.value for e in (dictionary or [])}
        data_state = DS_ExportedDataState(
            type="duc",
            version=DUC_SCHEMA_VERSION,
            source=f"ducpy_{name}",
            thumbnail=thumbnail or b"",
            elements=elements or [],
            blocks=blocks or [],
            groups=groups or [],
            regions=regions or [],
            layers=layers or [],
            standards=standards or [],
            dictionary=dict_map,
            duc_local_state=duc_local_state,
            duc_global_state=duc_global_state,
            version_graph=version_graph,
            files=external_files or [],
        )
        return serialize_as_flatbuffers(data_state)
    except Exception as e:
        logger.error(f"Failed to serialize DUC file: {str(e)}", exc_info=True)
        raise
