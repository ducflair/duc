# parse.py
# Comprehensive FlatBuffers -> dataclasses parser for Duc schema

from __future__ import annotations

import json
from typing import List, Dict, Optional, Union, Any, IO

import flatbuffers
from flatbuffers.table import Table

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
    DucBlockInstance as DS_DucBlockInstanceElement,
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
    DucBlockMetadata as DS_DucBlockMetadata,
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
    DucBlockAttributeDefinition as DS_DucBlockAttributeDefinition,
    DucBlockAttributeDefinitionEntry as DS_DucBlockAttributeDefinitionEntry,
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
    DucView as DS_DucView,
    DucUcs as DS_DucUcs,
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

# Enums (we only need types for Optional typing and constants occasionally)
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

# FlatBuffers generated classes (reading API)
from ducpy.Duc.ExportedDataState import ExportedDataState as FBSExportedDataState
from ducpy.Duc.ElementWrapper import ElementWrapper as FBSElementWrapper
from ducpy.Duc.DucRectangleElement import DucRectangleElement as FBSDucRectangleElement
from ducpy.Duc.DucPolygonElement import DucPolygonElement as FBSDucPolygonElement
from ducpy.Duc.DucEllipseElement import DucEllipseElement as FBSDucEllipseElement
from ducpy.Duc.DucEmbeddableElement import DucEmbeddableElement as FBSDucEmbeddableElement
from ducpy.Duc.DucPdfElement import DucPdfElement as FBSDucPdfElement
from ducpy.Duc.DucMermaidElement import DucMermaidElement as FBSDucMermaidElement
from ducpy.Duc.DucTableElement import DucTableElement as FBSDucTableElement
from ducpy.Duc.DucImageElement import DucImageElement as FBSDucImageElement
from ducpy.Duc.DucTextElement import DucTextElement as FBSDucTextElement
from ducpy.Duc.DucLinearElement import DucLinearElement as FBSDucLinearElement
from ducpy.Duc.DucArrowElement import DucArrowElement as FBSDucArrowElement
from ducpy.Duc.DucFreeDrawElement import DucFreeDrawElement as FBSDucFreeDrawElement
from ducpy.Duc.DucBlockInstanceElement import DucBlockInstanceElement as FBSDucBlockInstanceElement
from ducpy.Duc.DucFrameElement import DucFrameElement as FBSDucFrameElement
from ducpy.Duc.DucPlotElement import DucPlotElement as FBSDucPlotElement
from ducpy.Duc.DucViewportElement import DucViewportElement as FBSDucViewportElement
from ducpy.Duc.DucXRayElement import DucXRayElement as FBSDucXRayElement
from ducpy.Duc.DucLeaderElement import DucLeaderElement as FBSDucLeaderElement
from ducpy.Duc.DucDimensionElement import DucDimensionElement as FBSDucDimensionElement
from ducpy.Duc.DucFeatureControlFrameElement import DucFeatureControlFrameElement as FBSDucFeatureControlFrameElement
from ducpy.Duc.DucDocElement import DucDocElement as FBSDucDocElement
from ducpy.Duc.DucParametricElement import DucParametricElement as FBSDucParametricElement

from ducpy.Duc.ElementContentBase import ElementContentBase as FBSElementContentBase
from ducpy.Duc.ElementStroke import ElementStroke as FBSElementStroke
from ducpy.Duc.ElementBackground import ElementBackground as FBSElementBackground
from ducpy.Duc.StrokeStyle import StrokeStyle as FBSStrokeStyle
from ducpy.Duc.StrokeSides import StrokeSides as FBSStrokeSides
from ducpy.Duc._DucElementStylesBase import _DucElementStylesBase as FBSDucElementStylesBase
from ducpy.Duc._DucElementBase import _DucElementBase as FBSDucElementBase
from ducpy.Duc.BoundElement import BoundElement as FBSBoundElement
from ducpy.Duc.DucPoint import DucPoint as FBSDucPoint
from ducpy.Duc.DucHead import DucHead as FBSDucHead
from ducpy.Duc.PointBindingPoint import PointBindingPoint as FBSPointBindingPoint
from ducpy.Duc.DucPointBinding import DucPointBinding as FBSDucPointBinding
from ducpy.Duc.DucLine import DucLine as FBSDucLine
from ducpy.Duc.DucLineReference import DucLineReference as FBSDucLineReference
from ducpy.Duc.DucPath import DucPath as FBSDucPath
from ducpy.Duc._DucLinearElementBase import _DucLinearElementBase as FBSDucLinearElementBase
from ducpy.Duc._DucStackBase import _DucStackBase as FBSDucStackBase
from ducpy.Duc.DucTextStyle import DucTextStyle as FBSDucTextStyle
from ducpy.Duc.LineSpacing import LineSpacing as FBSLineSpacing
from ducpy.Duc.Margins import Margins as FBSMargins

from ducpy.Duc.DucTableStyle import DucTableStyle as FBSDucTableStyle
from ducpy.Duc.DucTableCellStyle import DucTableCellStyle as FBSDucTableCellStyle
from ducpy.Duc.DucTableColumn import DucTableColumn as FBSDucTableColumn
from ducpy.Duc.DucTableRow import DucTableRow as FBSDucTableRow
from ducpy.Duc.DucTableCell import DucTableCell as FBSDucTableCell
from ducpy.Duc.DucTableCellSpan import DucTableCellSpan as FBSDucTableCellSpan
from ducpy.Duc.DucTableColumnEntry import DucTableColumnEntry as FBSDucTableColumnEntry
from ducpy.Duc.DucTableRowEntry import DucTableRowEntry as FBSDucTableRowEntry
from ducpy.Duc.DucTableCellEntry import DucTableCellEntry as FBSDucTableCellEntry
from ducpy.Duc.DucTableAutoSize import DucTableAutoSize as FBSDucTableAutoSize

from ducpy.Duc.ImageCrop import ImageCrop as FBSImageCrop
from ducpy.Duc.DucImageFilter import DucImageFilter as FBSDucImageFilter
from ducpy.Duc.TilingProperties import TilingProperties as FBSTilingProperties
from ducpy.Duc.HatchPatternLine import HatchPatternLine as FBSHatchPatternLine
from ducpy.Duc.CustomHatchPattern import CustomHatchPattern as FBSCustomHatchPattern
from ducpy.Duc.DucHatchStyle import DucHatchStyle as FBSDucHatchStyle

from ducpy.Duc.DucTextDynamicElementSource import DucTextDynamicElementSource as FBSDucTextDynamicElementSource
from ducpy.Duc.DucTextDynamicDictionarySource import DucTextDynamicDictionarySource as FBSDucTextDynamicDictionarySource
from ducpy.Duc.DucTextDynamicSource import DucTextDynamicSource as FBSDucTextDynamicSource
from ducpy.Duc.DucTextDynamicPart import DucTextDynamicPart as FBSDucTextDynamicPart

from ducpy.Duc.DucFreeDrawEnds import DucFreeDrawEnds as FBSDucFreeDrawEnds

from ducpy.Duc.StringValueEntry import StringValueEntry as FBSStringValueEntry
from ducpy.Duc.DucBlockDuplicationArray import DucBlockDuplicationArray as FBSDucBlockDuplicationArray

from ducpy.Duc.PlotLayout import PlotLayout as FBSPlotLayout
from ducpy.Duc.DucPlotStyle import DucPlotStyle as FBSDucPlotStyle
from ducpy.Duc.DucViewportStyle import DucViewportStyle as FBSDucViewportStyle
from ducpy.Duc.DucXRayStyle import DucXRayStyle as FBSDucXRayStyle

from ducpy.Duc.LeaderTextBlockContent import LeaderTextBlockContent as FBSLeaderTextBlockContent
from ducpy.Duc.LeaderBlockContent import LeaderBlockContent as FBSLeaderBlockContent
from ducpy.Duc.LeaderContent import LeaderContent as FBSLeaderContent

from ducpy.Duc.DimensionDefinitionPoints import DimensionDefinitionPoints as FBSDimensionDefinitionPoints
from ducpy.Duc.DimensionBindings import DimensionBindings as FBSDimensionBindings
from ducpy.Duc.DimensionBaselineData import DimensionBaselineData as FBSDimensionBaselineData
from ducpy.Duc.DimensionContinueData import DimensionContinueData as FBSDimensionContinueData

from ducpy.Duc.DimensionLineStyle import DimensionLineStyle as FBSDimensionLineStyle
from ducpy.Duc.DimensionExtLineStyle import DimensionExtLineStyle as FBSDimensionExtLineStyle
from ducpy.Duc.DimensionSymbolStyle import DimensionSymbolStyle as FBSDimensionSymbolStyle
from ducpy.Duc.DimensionToleranceStyle import DimensionToleranceStyle as FBSDimensionToleranceStyle
from ducpy.Duc.DucDimensionStyle import DucDimensionStyle as FBSDucDimensionStyle

from ducpy.Duc.DatumReference import DatumReference as FBSDatumReference
from ducpy.Duc.ToleranceClause import ToleranceClause as FBSToleranceClause
from ducpy.Duc.FeatureControlFrameSegment import FeatureControlFrameSegment as FBSFeatureControlFrameSegment
from ducpy.Duc.FCFBetweenModifier import FCFBetweenModifier as FBSFCFBetweenModifier
from ducpy.Duc.FCFProjectedZoneModifier import FCFProjectedZoneModifier as FBSFCFProjectedZoneModifier
from ducpy.Duc.FCFFrameModifiers import FCFFrameModifiers as FBSFCFFrameModifiers
from ducpy.Duc.FCFDatumDefinition import FCFDatumDefinition as FBSFCFDatumDefinition
from ducpy.Duc.FCFSegmentRow import FCFSegmentRow as FBSFCFSegmentRow
from ducpy.Duc.DucFeatureControlFrameStyle import DucFeatureControlFrameStyle as FBSDucFeatureControlFrameStyle
from ducpy.Duc.FCFLayoutStyle import FCFLayoutStyle as FBSFCFLayoutStyle
from ducpy.Duc.FCFSymbolStyle import FCFSymbolStyle as FBSFCFSymbolStyle
from ducpy.Duc.FCFDatumStyle import FCFDatumStyle as FBSFCFDatumStyle

from ducpy.Duc.TextColumn import TextColumn as FBSTextColumn
from ducpy.Duc.ColumnLayout import ColumnLayout as FBSColumnLayout
from ducpy.Duc.DucDocStyle import DucDocStyle as FBSDucDocStyle

from ducpy.Duc.ParametricSource import ParametricSource as FBSParametricSource

from ducpy.Duc.DucBlock import DucBlock as FBSDucBlock
from ducpy.Duc.DucBlockMetadata import DucBlockMetadata as FBSDucBlockMetadata
from ducpy.Duc.DucBlockAttributeDefinition import DucBlockAttributeDefinition as FBSDucBlockAttributeDefinition
from ducpy.Duc.DucBlockAttributeDefinitionEntry import DucBlockAttributeDefinitionEntry as FBSDucBlockAttributeDefinitionEntry

from ducpy.Duc.DucGroup import DucGroup as FBSDucGroup
from ducpy.Duc.DucRegion import DucRegion as FBSDucRegion
from ducpy.Duc.DucLayer import DucLayer as FBSDucLayer
from ducpy.Duc.DucLayerOverrides import DucLayerOverrides as FBSDucLayerOverrides

# Standards FB classes
from ducpy.Duc.Identifier import Identifier as FBSIdentifier
from ducpy.Duc._UnitSystemBase import _UnitSystemBase as FBS_UnitSystemBase
from ducpy.Duc.LinearUnitSystem import LinearUnitSystem as FBSLinearUnitSystem
from ducpy.Duc.AngularUnitSystem import AngularUnitSystem as FBSAngularUnitSystem
from ducpy.Duc.AlternateUnits import AlternateUnits as FBSAlternateUnits
from ducpy.Duc.PrimaryUnits import PrimaryUnits as FBSPrimaryUnits
from ducpy.Duc.StandardUnits import StandardUnits as FBSStandardUnits
from ducpy.Duc.UnitPrecision import UnitPrecision as FBSUnitPrecision
from ducpy.Duc.StandardOverrides import StandardOverrides as FBSStandardOverrides

from ducpy.Duc.DucCommonStyle import DucCommonStyle as FBSDucCommonStyle
from ducpy.Duc.IdentifiedCommonStyle import IdentifiedCommonStyle as FBSIdentifiedCommonStyle
from ducpy.Duc.IdentifiedStackLikeStyle import IdentifiedStackLikeStyle as FBSIdentifiedStackLikeStyle
from ducpy.Duc.IdentifiedTextStyle import IdentifiedTextStyle as FBSIdentifiedTextStyle
from ducpy.Duc.IdentifiedDimensionStyle import IdentifiedDimensionStyle as FBSIdentifiedDimensionStyle
from ducpy.Duc.IdentifiedLeaderStyle import IdentifiedLeaderStyle as FBSIdentifiedLeaderStyle
from ducpy.Duc.IdentifiedFCFStyle import IdentifiedFCFStyle as FBSIdentifiedFCFStyle
from ducpy.Duc.IdentifiedTableStyle import IdentifiedTableStyle as FBSIdentifiedTableStyle
from ducpy.Duc.IdentifiedDocStyle import IdentifiedDocStyle as FBSIdentifiedDocStyle
from ducpy.Duc.IdentifiedViewportStyle import IdentifiedViewportStyle as FBSIdentifiedViewportStyle
from ducpy.Duc.IdentifiedHatchStyle import IdentifiedHatchStyle as FBSIdentifiedHatchStyle
from ducpy.Duc.IdentifiedXRayStyle import IdentifiedXRayStyle as FBSIdentifiedXRayStyle
from ducpy.Duc.StandardStyles import StandardStyles as FBSStandardStyles

from ducpy.Duc.GridStyle import GridStyle as FBSGridStyle
from ducpy.Duc.PolarGridSettings import PolarGridSettings as FBSPolarGridSettings
from ducpy.Duc.IsometricGridSettings import IsometricGridSettings as FBSIsometricGridSettings
from ducpy.Duc.GridSettings import GridSettings as FBSGridSettings
from ducpy.Duc.SnapOverride import SnapOverride as FBSSnapOverride
from ducpy.Duc.DynamicSnapSettings import DynamicSnapSettings as FBSDynamicSnapSettings
from ducpy.Duc.PolarTrackingSettings import PolarTrackingSettings as FBSPolarTrackingSettings
from ducpy.Duc.TrackingLineStyle import TrackingLineStyle as FBSTrackingLineStyle
from ducpy.Duc.LayerSnapFilters import LayerSnapFilters as FBSLayerSnapFilters
from ducpy.Duc.SnapMarkerStyle import SnapMarkerStyle as FBSSnapMarkerStyle
from ducpy.Duc.SnapMarkerStyleEntry import SnapMarkerStyleEntry as FBSSnapMarkerStyleEntry
from ducpy.Duc.SnapMarkerSettings import SnapMarkerSettings as FBSSnapMarkerSettings
from ducpy.Duc.SnapSettings import SnapSettings as FBSSnapSettings
from ducpy.Duc.IdentifiedGridSettings import IdentifiedGridSettings as FBSIdentifiedGridSettings
from ducpy.Duc.IdentifiedSnapSettings import IdentifiedSnapSettings as FBSIdentifiedSnapSettings
from ducpy.Duc.IdentifiedUcs import IdentifiedUcs as FBSIdentifiedUcs
from ducpy.Duc.IdentifiedView import IdentifiedView as FBSIdentifiedView
from ducpy.Duc.DucUcs import DucUcs as FBSDucUcs
from ducpy.Duc.DucView import DucView as FBSDucView
from ducpy.Duc.StandardViewSettings import StandardViewSettings as FBSStandardViewSettings
from ducpy.Duc.DimensionValidationRules import DimensionValidationRules as FBSDimensionValidationRules
from ducpy.Duc.LayerValidationRules import LayerValidationRules as FBSLayerValidationRules
from ducpy.Duc.StandardValidation import StandardValidation as FBSStandardValidation
from ducpy.Duc.Standard import Standard as FBSStandard
from ducpy.Duc.DucLeaderStyle import DucLeaderStyle as FBSDucLeaderStyle
from ducpy.Duc._DucStackBase import _DucStackBase as FBSDucStackElementBase
from ducpy.Duc.DimensionFitStyle import DimensionFitStyle as FBSDimensionFitStyle

# Version graph and external files
from ducpy.Duc.DucExternalFileData import DucExternalFileData as FBSDucExternalFileData
from ducpy.Duc.DucExternalFileEntry import DucExternalFileEntry as FBSDucExternalFileEntry

from ducpy.Duc.VersionBase import VersionBase as FBSVersionBase
from ducpy.Duc.Checkpoint import Checkpoint as FBSCheckpoint
from ducpy.Duc.JSONPatchOperation import JSONPatchOperation as FBSJSONPatchOperation
from ducpy.Duc.Delta import Delta as FBSDelta
from ducpy.Duc.VersionGraphMetadata import VersionGraphMetadata as FBSVersionGraphMetadata
from ducpy.Duc.VersionGraph import VersionGraph as FBSVersionGraph

# Unions for runtime decisions
from ducpy.Duc import Element as FBS_Element
from ducpy.Duc import LeaderContentData as FBS_LeaderContentData
from ducpy.Duc import DucTextDynamicSourceData as FBS_DucTextDynamicSourceData

# Import missing enums
from ducpy.Duc.TEXT_FIELD_SOURCE_TYPE import TEXT_FIELD_SOURCE_TYPE


# =============================================================================
# Helpers
# =============================================================================

def _s(b: Optional[bytes]) -> Optional[str]:
    return b.decode("utf-8") if b else None

def _s_req(b: Optional[bytes]) -> str:
    return b.decode("utf-8") if b else ""

def _read_bytes_from_numpy(obj, length_method_name: str, numpy_method_name: str, item_method_name: str) -> bytes:
    """
    Try to read a ubyte vector as bytes using AsNumpy() if available,
    otherwise fallback to iterating items.
    """
    length = getattr(obj, length_method_name)()
    if length <= 0:
        return b""
    try:
        as_np = getattr(obj, numpy_method_name)
        arr = as_np()
        if arr is None:
            raise RuntimeError("No numpy view")
        return bytes(arr)
    except Exception:
        getter = getattr(obj, item_method_name)
        return bytes(bytearray([getter(i) for i in range(length)]))

def _read_float_vector(obj, length_name: str, item_name: str) -> List[float]:
    n = getattr(obj, length_name)()
    if n <= 0:
        return []
    get = getattr(obj, item_name)
    return [get(i) for i in range(n)]

def _read_double_vector(obj, length_name: str, item_name: str) -> List[float]:
    # Python generated code returns python floats for double as well
    return _read_float_vector(obj, length_name, item_name)

def _read_int_vector(obj, length_name: str, item_name: str) -> List[int]:
    n = getattr(obj, length_name)()
    if n <= 0:
        return []
    get = getattr(obj, item_name)
    return [get(i) for i in range(n)]

def _read_str_vector(obj, length_name: str, item_name: str) -> List[str]:
    n = getattr(obj, length_name)()
    if n <= 0:
        return []
    get = getattr(obj, item_name)
    return [_s_req(get(i)) for i in range(n)]

def _json_or_none(s: Optional[bytes]) -> Optional[Dict[str, Any]]:
    if not s:
        return None
    try:
        return json.loads(s.decode("utf-8"))
    except Exception:
        return None

def _geopoint_struct_to_ds(gp) -> Optional[DS_GeometricPoint]:
    if gp is None:
        return None
    # flatbuffers struct proxies usually expose X() and Y()
    try:
        return DS_GeometricPoint(x=gp.X(), y=gp.Y())
    except Exception:
        return None


# =============================================================================
# Basic small tables
# =============================================================================

def parse_fbs_dictionary_entry(obj) -> DS_DictionaryEntry:
    return DS_DictionaryEntry(
        key=_s_req(obj.Key()),
        value=_s_req(obj.Value()),
    )

def parse_fbs_string_value_entry(obj: FBSStringValueEntry) -> DS_StringValueEntry:
    return DS_StringValueEntry(
        key=_s_req(obj.Key()),
        value=_s_req(obj.Value()),
    )

def parse_fbs_identifier(obj: FBSIdentifier) -> DS_Identifier:
    return DS_Identifier(
        id=_s_req(obj.Id()),
        name=_s_req(obj.Name()),
        description=_s_req(obj.Description()),
    )

# =============================================================================
# Geometry and content
# =============================================================================

def parse_fbs_duc_point(obj: FBSDucPoint) -> DS_DucPoint:
    return DS_DucPoint(
        x=obj.X(),
        y=obj.Y(),
        mirroring=obj.Mirroring() if hasattr(obj, "Mirroring") else None,
    )

def parse_fbs_margins(obj: FBSMargins):
    # This function returns DS_Margins equivalent; but DS dataclasses embed this inside their own types.
    # We'll return a simple structure for margins where used (DucTableCellStyle.margins, PlotLayout.margins).
    from ducpy.classes.ElementsClass import Margins as DS_Margins  # local import to avoid name shadowing
    return DS_Margins(
        top=obj.Top(),
        right=obj.Right(),
        bottom=obj.Bottom(),
        left=obj.Left(),
    )

def parse_fbs_tiling_properties(obj: FBSTilingProperties) -> Optional[DS_TilingProperties]:
    if obj is None:
        return None
    spacing = obj.Spacing() if hasattr(obj, "Spacing") else None
    offset_x = obj.OffsetX() if hasattr(obj, "OffsetX") else None
    offset_y = obj.OffsetY() if hasattr(obj, "OffsetY") else None
    return DS_TilingProperties(
        size_in_percent=obj.SizeInPercent(),
        angle=obj.Angle(),
        spacing=spacing,
        offset_x=offset_x,
        offset_y=offset_y,
    )

def parse_fbs_hatch_pattern_line(obj: FBSHatchPatternLine):
    from ducpy.classes.ElementsClass import HatchPatternLine as DS_HatchPatternLine
    origin = parse_fbs_duc_point(obj.Origin())
    offset = _read_double_vector(obj, "OffsetLength", "Offset")
    dash = _read_double_vector(obj, "DashPatternLength", "DashPattern")
    return DS_HatchPatternLine(
        angle=obj.Angle(),
        origin=origin,
        offset=offset,
        dash_pattern=dash,
    )

def parse_fbs_custom_hatch_pattern(obj: FBSCustomHatchPattern):
    if obj is None:
        return None
    from ducpy.classes.ElementsClass import CustomHatchPattern as DS_CustomHatchPattern
    lines = [parse_fbs_hatch_pattern_line(obj.Lines(i)) for i in range(obj.LinesLength())]
    return DS_CustomHatchPattern(
        name=_s_req(obj.Name()),
        description=_s_req(obj.Description()),
        lines=lines,
    )

def parse_fbs_duc_hatch_style(obj: FBSDucHatchStyle) -> Optional[DS_DucHatchStyle]:
    if obj is None:
        return None
    return DS_DucHatchStyle(
        pattern_name=_s_req(obj.PatternName()),
        pattern_scale=obj.PatternScale(),
        pattern_angle=obj.PatternAngle(),
        pattern_origin=parse_fbs_duc_point(obj.PatternOrigin()),
        pattern_double=obj.PatternDouble(),
        hatch_style=obj.HatchStyle() if hasattr(obj, "HatchStyle") else None,
        custom_pattern=parse_fbs_custom_hatch_pattern(obj.CustomPattern()) if obj.CustomPattern() else None,
    )

def parse_fbs_duc_image_filter(obj: FBSDucImageFilter) -> Optional[DS_DucImageFilter]:
    if obj is None:
        return None
    return DS_DucImageFilter(
        brightness=obj.Brightness(),
        contrast=obj.Contrast(),
    )

def parse_fbs_element_content_base(obj: FBSElementContentBase) -> DS_ElementContentBase:
    tiling = parse_fbs_tiling_properties(obj.Tiling()) if obj.Tiling() else None
    hatch = parse_fbs_duc_hatch_style(obj.Hatch()) if obj.Hatch() else None
    img_filter = parse_fbs_duc_image_filter(obj.ImageFilter()) if obj.ImageFilter() else None
    return DS_ElementContentBase(
        src=_s_req(obj.Src()),
        visible=obj.Visible(),
        opacity=obj.Opacity(),
        tiling=tiling,
        hatch=hatch,
        image_filter=img_filter,
        preference=obj.Preference() if hasattr(obj, "Preference") else None,
    )

def parse_fbs_stroke_style(obj: FBSStrokeStyle) -> DS_StrokeStyle:
    if obj is None:
        return DS_StrokeStyle(
            preference=None, dash=None, dash_line_override=None, cap=None, join=None, dash_cap=None, miter_limit=None
        )
    return DS_StrokeStyle(
        preference=obj.Preference() if hasattr(obj, "Preference") else None,
        dash=_read_double_vector(obj, "DashLength", "Dash") if obj else None,
        dash_line_override=_s(obj.DashLineOverride()) if obj else None,
        cap=obj.Cap() if obj and hasattr(obj, "Cap") else None,
        join=obj.Join() if obj and hasattr(obj, "Join") else None,
        dash_cap=obj.DashCap() if obj and hasattr(obj, "DashCap") else None,
        miter_limit=obj.MiterLimit() if obj and hasattr(obj, "MiterLimit") else None,
    )

def parse_fbs_stroke_sides(obj: FBSStrokeSides) -> Optional[DS_StrokeSides]:
    if obj is None:
        return None
    return DS_StrokeSides(
        preference=obj.Preference() if hasattr(obj, "Preference") else None,
        values=_read_double_vector(obj, "ValuesLength", "Values"),
    )

def parse_fbs_element_stroke(obj: FBSElementStroke) -> DS_ElementStroke:
    return DS_ElementStroke(
        content=parse_fbs_element_content_base(obj.Content()),
        width=obj.Width(),
        style=parse_fbs_stroke_style(obj.Style()),
        placement=obj.Placement() if hasattr(obj, "Placement") else None,
        stroke_sides=parse_fbs_stroke_sides(obj.StrokeSides()),
    )

def parse_fbs_element_background(obj: FBSElementBackground) -> DS_ElementBackground:
    if obj is None:
        content = DS_ElementContentBase(
            src="", visible=True, opacity=1.0, tiling=None, hatch=None, image_filter=None, preference=None
        )
        return DS_ElementBackground(content=content)
    return DS_ElementBackground(
        content=parse_fbs_element_content_base(obj.Content())
    )

def parse_fbs_duc_element_styles_base(obj: FBSDucElementStylesBase) -> Optional[DS_DucElementStylesBase]:
    if obj is None:
        return None
    
    # Parse background - take first or create default
    background = None
    try:
        if hasattr(obj, 'BackgroundLength') and obj.BackgroundLength() > 0:
            bg_obj = obj.Background(0)
            if bg_obj:
                background = parse_fbs_element_background(bg_obj)
    except Exception:
        pass
    
    # If no background, create default
    if background is None:
        background = DS_ElementBackground(content=DS_ElementContentBase(
            src="", visible=True, opacity=1.0, tiling=None, hatch=None, image_filter=None, preference=None
        ))
    
    # Parse stroke - take first or create default
    stroke = None
    try:
        if hasattr(obj, 'StrokeLength') and obj.StrokeLength() > 0:
            stroke_obj = obj.Stroke(0)
            if stroke_obj:
                stroke = parse_fbs_element_stroke(stroke_obj)
    except Exception:
        pass
    
    # If no stroke, create default
    if stroke is None:
        stroke = DS_ElementStroke(
            content=DS_ElementContentBase(
                src="", visible=True, opacity=1.0, tiling=None, hatch=None, image_filter=None, preference=None
            ),
            width=1.0,
            style=DS_StrokeStyle(
                preference=None, dash=None, dash_line_override=None, cap=None, join=None, dash_cap=None, miter_limit=None
            ),
            placement=None,
            stroke_sides=None
        )
    
    blending = obj.Blending() if hasattr(obj, "Blending") else None
    return DS_DucElementStylesBase(
        roundness=obj.Roundness() if hasattr(obj, "Roundness") else 0.0,
        background=background,
        stroke=stroke,
        opacity=obj.Opacity() if hasattr(obj, "Opacity") else 1.0,
        blending=blending,
    )

# =============================================================================
# Base element and shared components
# =============================================================================

def parse_fbs_bound_element(obj: FBSBoundElement) -> DS_BoundElement:
    return DS_BoundElement(
        id=_s_req(obj.Id()),
        type=_s_req(obj.Type()),
    )

def parse_fbs_duc_element_base(obj: FBSDucElementBase) -> DS_DucElementBase:
    styles = parse_fbs_duc_element_styles_base(obj.Styles()) if obj.Styles() else None
    group_ids = _read_str_vector(obj, "GroupIdsLength", "GroupIds") if hasattr(obj, "GroupIdsLength") else []
    block_ids = _read_str_vector(obj, "BlockIdsLength", "BlockIds") if hasattr(obj, "BlockIdsLength") else []
    region_ids = _read_str_vector(obj, "RegionIdsLength", "RegionIds") if hasattr(obj, "RegionIdsLength") else []
    bound_elements = []
    try:
        if hasattr(obj, "BoundElementsLength"):
            bound_elements = [parse_fbs_bound_element(obj.BoundElements(i)) for i in range(obj.BoundElementsLength())]
    except Exception:
        pass
    custom_data = _json_or_none(obj.CustomData()) if hasattr(obj, "CustomData") else None
    return DS_DucElementBase(
        id=_s_req(obj.Id()) if hasattr(obj, "Id") else "",
        styles=styles,
        x=obj.X() if hasattr(obj, "X") else 0.0,
        y=obj.Y() if hasattr(obj, "Y") else 0.0,
        width=obj.Width() if hasattr(obj, "Width") else 0.0,
        height=obj.Height() if hasattr(obj, "Height") else 0.0,
        angle=obj.Angle() if hasattr(obj, "Angle") else 0.0,
        scope=_s_req(obj.Scope()) if hasattr(obj, "Scope") else "",
        label=_s_req(obj.Label()) if hasattr(obj, "Label") else "",
        is_visible=obj.IsVisible() if hasattr(obj, "IsVisible") else True,
        seed=obj.Seed() if hasattr(obj, "Seed") else 0,
        version=obj.Version() if hasattr(obj, "Version") else 0,
        version_nonce=obj.VersionNonce() if hasattr(obj, "VersionNonce") else 0,
        updated=obj.Updated() if hasattr(obj, "Updated") else 0,
        is_plot=obj.IsPlot() if hasattr(obj, "IsPlot") else True,
        is_annotative=obj.IsAnnotative() if hasattr(obj, "IsAnnotative") else False,
        is_deleted=obj.IsDeleted() if hasattr(obj, "IsDeleted") else False,
        group_ids=group_ids,
        block_ids=block_ids,
        region_ids=region_ids,
        z_index=obj.ZIndex() if hasattr(obj, "ZIndex") else 0,
        locked=obj.Locked() if hasattr(obj, "Locked") else False,
        description=_s(obj.Description()) if hasattr(obj, "Description") else None,
        index=_s(obj.Index()) if hasattr(obj, "Index") else None,
        link=_s(obj.Link()) if hasattr(obj, "Link") else None,
        layer_id=_s(obj.LayerId()) if hasattr(obj, "LayerId") else None,
        frame_id=_s(obj.FrameId()) if hasattr(obj, "FrameId") else None,
        bound_elements=bound_elements if bound_elements else None,
        custom_data=custom_data,
    )

def parse_fbs_duc_head(obj: FBSDucHead) -> DS_DucHead:
    return DS_DucHead(
        size=obj.Size(),
        type=obj.Type() if hasattr(obj, "Type") else None,
        block_id=_s(obj.BlockId()),
    )

def parse_fbs_point_binding_point(obj: FBSPointBindingPoint) -> DS_PointBindingPoint:
    return DS_PointBindingPoint(
        index=obj.Index(),
        offset=obj.Offset(),
    )

def parse_fbs_duc_point_binding(obj: FBSDucPointBinding) -> Optional[DS_DucPointBinding]:
    if obj is None:
        return None
    fixed = obj.FixedPoint()
    focus_value = obj.Focus() if hasattr(obj, "Focus") else None
    return DS_DucPointBinding(
        element_id=_s_req(obj.ElementId()),
        focus=focus_value,
        gap=obj.Gap(),
        fixed_point=_geopoint_struct_to_ds(fixed),
        point=parse_fbs_point_binding_point(obj.Point()) if obj.Point() else None,
        head=parse_fbs_duc_head(obj.Head()) if obj.Head() else None,
    )

def parse_fbs_duc_line_reference(obj: FBSDucLineReference) -> DS_DucLineReference:
    handle = obj.Handle()
    return DS_DucLineReference(
        index=obj.Index(),
        handle=_geopoint_struct_to_ds(handle),
    )

def parse_fbs_duc_line(obj: FBSDucLine) -> DS_DucLine:
    return DS_DucLine(
        start=parse_fbs_duc_line_reference(obj.Start()),
        end=parse_fbs_duc_line_reference(obj.End()),
    )

def parse_fbs_duc_path(obj: FBSDucPath) -> DS_DucPath:
    line_indices = _read_int_vector(obj, "LineIndicesLength", "LineIndices")
    return DS_DucPath(
        line_indices=line_indices,
        background=parse_fbs_element_background(obj.Background()) if obj.Background() else None,
        stroke=parse_fbs_element_stroke(obj.Stroke()) if obj.Stroke() else None,
    )

def parse_fbs_duc_linear_element_base(obj: FBSDucLinearElementBase) -> DS_DucLinearElementBase:
    points = [parse_fbs_duc_point(obj.Points(i)) for i in range(obj.PointsLength())]
    lines = [parse_fbs_duc_line(obj.Lines(i)) for i in range(obj.LinesLength())]
    path_overrides = [parse_fbs_duc_path(obj.PathOverrides(i)) for i in range(obj.PathOverridesLength())]
    return DS_DucLinearElementBase(
        base=parse_fbs_duc_element_base(obj.Base()),
        points=points,
        lines=lines,
        path_overrides=path_overrides,
        last_committed_point=parse_fbs_duc_point(obj.LastCommittedPoint()) if obj.LastCommittedPoint() else None,
        start_binding=parse_fbs_duc_point_binding(obj.StartBinding()) if obj.StartBinding() else None,
        end_binding=parse_fbs_duc_point_binding(obj.EndBinding()) if obj.EndBinding() else None,
    )

def parse_fbs_duc_stack_like_styles(obj) -> DS_DucStackLikeStyles:
    blending = obj.Blending() if hasattr(obj, "Blending") and obj.Blending() is not None else None
    return DS_DucStackLikeStyles(
        opacity=obj.Opacity() if hasattr(obj, "Opacity") else 1.0,
        labeling_color=_s_req(obj.LabelingColor()) if hasattr(obj, "LabelingColor") else "",
        blending=blending,
    )

def parse_fbs_duc_stack_base(obj: FBSDucStackBase) -> DS_DucStackBase:
    styles = parse_fbs_duc_stack_like_styles(obj.Styles())
    return DS_DucStackBase(
        label=_s_req(obj.Label()),
        description=_s_req(obj.Description()),
        is_collapsed=obj.IsCollapsed(),
        is_plot=obj.IsPlot(),
        is_visible=obj.IsVisible(),
        locked=obj.Locked(),
        styles=styles,
    )

def parse_fbs_duc_stack_element_base(obj: FBSDucStackElementBase) -> DS_DucStackElementBase:
    base = parse_fbs_duc_element_base(obj.Base())
    stack_base = parse_fbs_duc_stack_base(obj.StackBase())
    clip = obj.Clip()
    label_visible = obj.LabelVisible()
    standard_override = _s(obj.StandardOverride())
    return DS_DucStackElementBase(
        base=base,
        stack_base=stack_base,
        clip=clip,
        label_visible=label_visible,
        standard_override=standard_override,
    )

# =============================================================================
# Element-specific styling
# =============================================================================

def parse_fbs_line_spacing(obj: FBSLineSpacing) -> Optional[DS_LineSpacing]:
    if obj is None:
        return None
    return DS_LineSpacing(
        value=obj.Value(),
        type=obj.Type() if hasattr(obj, "Type") else None,
    )

def parse_fbs_duc_text_style(obj: FBSDucTextStyle) -> DS_DucTextStyle:
    return DS_DucTextStyle(
        is_ltr=obj.IsLtr(),
        font_family=_s_req(obj.FontFamily()),
        big_font_family=_s_req(obj.BigFontFamily()),
        line_height=obj.LineHeight(),
        line_spacing=parse_fbs_line_spacing(obj.LineSpacing()) if obj.LineSpacing() else None,
        oblique_angle=obj.ObliqueAngle(),
        font_size=obj.FontSize(),
        width_factor=obj.WidthFactor(),
        is_upside_down=obj.IsUpsideDown(),
        is_backwards=obj.IsBackwards(),
        text_align=obj.TextAlign() if hasattr(obj, "TextAlign") else None,
        vertical_align=obj.VerticalAlign() if hasattr(obj, "VerticalAlign") else None,
        paper_text_height=obj.PaperTextHeight() if hasattr(obj, "PaperTextHeight") else None,
    )

def parse_fbs_table_cell_style(obj: FBSDucTableCellStyle) -> DS_DucTableCellStyle:
    return DS_DucTableCellStyle(
        base_style=parse_fbs_duc_element_styles_base(obj.BaseStyle()),
        text_style=parse_fbs_duc_text_style(obj.TextStyle()),
        margins=parse_fbs_margins(obj.Margins()),
        alignment=obj.Alignment() if hasattr(obj, "Alignment") else None,
    )

def parse_fbs_table_style(obj: FBSDucTableStyle) -> Optional[DS_DucTableStyle]:
    if obj is None:
        return None
    return DS_DucTableStyle(
        header_row_style=parse_fbs_table_cell_style(obj.HeaderRowStyle()),
        data_row_style=parse_fbs_table_cell_style(obj.DataRowStyle()),
        data_column_style=parse_fbs_table_cell_style(obj.DataColumnStyle()),
        flow_direction=obj.FlowDirection() if hasattr(obj, "FlowDirection") else None,
    )

def parse_fbs_leader_style(obj: "FBSDucLeaderStyle") -> DS_DucLeaderStyle:
    heads = [parse_fbs_duc_head(obj.HeadsOverride(i)) for i in range(obj.HeadsOverrideLength())]
    return DS_DucLeaderStyle(
        text_style=parse_fbs_duc_text_style(obj.TextStyle()),
        text_attachment=obj.TextAttachment() if hasattr(obj, "TextAttachment") else None,
        block_attachment=obj.BlockAttachment() if hasattr(obj, "BlockAttachment") else None,
        dogleg=obj.Dogleg() if hasattr(obj, "Dogleg") else None,
        heads_override=heads if heads else None,
    )

def parse_fbs_dimension_tolerance_style(obj: FBSDimensionToleranceStyle) -> DS_DimensionToleranceStyle:
    return DS_DimensionToleranceStyle(
        enabled=obj.Enabled(),
        upper_value=obj.UpperValue(),
        lower_value=obj.LowerValue(),
        precision=obj.Precision(),
        display_method=obj.DisplayMethod() if hasattr(obj, "DisplayMethod") else None,
        text_style=parse_fbs_duc_text_style(obj.TextStyle()) if obj.TextStyle() else None,
    )

def parse_fbs_dimension_fit_style(obj: FBSDimensionFitStyle) -> DS_DimensionFitStyle:
    return DS_DimensionFitStyle(
        force_text_inside=obj.ForceTextInside(),
        rule=obj.Rule() if hasattr(obj, "Rule") else None,
        text_placement=obj.TextPlacement() if hasattr(obj, "TextPlacement") else None,
    )

def parse_fbs_dimension_line_style(obj: FBSDimensionLineStyle) -> DS_DimensionLineStyle:
    return DS_DimensionLineStyle(
        stroke=parse_fbs_element_stroke(obj.Stroke()),
        text_gap=obj.TextGap(),
    )

def parse_fbs_dimension_ext_line_style(obj: FBSDimensionExtLineStyle) -> DS_DimensionExtLineStyle:
    return DS_DimensionExtLineStyle(
        stroke=parse_fbs_element_stroke(obj.Stroke()),
        overshoot=obj.Overshoot(),
        offset=obj.Offset(),
    )

def parse_fbs_dimension_symbol_style(obj: FBSDimensionSymbolStyle) -> DS_DimensionSymbolStyle:
    heads = [parse_fbs_duc_head(obj.HeadsOverride(i)) for i in range(obj.HeadsOverrideLength())]
    return DS_DimensionSymbolStyle(
        center_mark_size=obj.CenterMarkSize(),
        center_mark_type=obj.CenterMarkType() if hasattr(obj, "CenterMarkType") else None,
        heads_override=heads if heads else None,
    )

def parse_fbs_dimension_style(obj: FBSDucDimensionStyle) -> DS_DucDimensionStyle:
    return DS_DucDimensionStyle(
        dim_line=parse_fbs_dimension_line_style(obj.DimLine()),
        ext_line=parse_fbs_dimension_ext_line_style(obj.ExtLine()),
        text_style=parse_fbs_duc_text_style(obj.TextStyle()),
        symbols=parse_fbs_dimension_symbol_style(obj.Symbols()),
        tolerance=parse_fbs_dimension_tolerance_style(obj.Tolerance()),
        fit=parse_fbs_dimension_fit_style(obj.Fit()),
    )

def parse_fbs_fcf_layout_style(obj: FBSFCFLayoutStyle) -> DS_FCFLayoutStyle:
    return DS_FCFLayoutStyle(
        padding=obj.Padding(),
        segment_spacing=obj.SegmentSpacing(),
        row_spacing=obj.RowSpacing(),
    )

def parse_fbs_fcf_symbol_style(obj: FBSFCFSymbolStyle) -> DS_FCFSymbolStyle:
    return DS_FCFSymbolStyle(
        scale=obj.Scale(),
    )

def parse_fbs_fcf_datum_style(obj: FBSFCFDatumStyle) -> DS_FCFDatumStyle:
    return DS_FCFDatumStyle(
        bracket_style=obj.BracketStyle() if hasattr(obj, "BracketStyle") else None
    )

def parse_fbs_feature_control_frame_style(obj: FBSDucFeatureControlFrameStyle) -> DS_DucFeatureControlFrameStyle:
    return DS_DucFeatureControlFrameStyle(
        text_style=parse_fbs_duc_text_style(obj.TextStyle()),
        layout=parse_fbs_fcf_layout_style(obj.Layout()),
        symbols=parse_fbs_fcf_symbol_style(obj.Symbols()),
        datum_style=parse_fbs_fcf_datum_style(obj.DatumStyle()),
    )

def parse_fbs_paragraph_formatting(obj) -> DS_ParagraphFormatting:
    return DS_ParagraphFormatting(
        first_line_indent=obj.FirstLineIndent(),
        hanging_indent=obj.HangingIndent(),
        left_indent=obj.LeftIndent(),
        right_indent=obj.RightIndent(),
        space_before=obj.SpaceBefore(),
        space_after=obj.SpaceAfter(),
        tab_stops=_read_double_vector(obj, "TabStopsLength", "TabStops"),
    )

def parse_fbs_stack_format_properties(obj) -> DS_StackFormatProperties:
    return DS_StackFormatProperties(
        upper_scale=obj.UpperScale(),
        lower_scale=obj.LowerScale(),
        alignment=obj.Alignment() if hasattr(obj, "Alignment") else None,
    )

def parse_fbs_stack_format(obj) -> DS_StackFormat:
    return DS_StackFormat(
        auto_stack=obj.AutoStack(),
        stack_chars=_read_str_vector(obj, "StackCharsLength", "StackChars"),
        properties=parse_fbs_stack_format_properties(obj.Properties()),
    )

def parse_fbs_doc_style(obj: FBSDucDocStyle) -> DS_DucDocStyle:
    return DS_DucDocStyle(
        text_style=parse_fbs_duc_text_style(obj.TextStyle()),
        paragraph=parse_fbs_paragraph_formatting(obj.Paragraph()),
        stack_format=parse_fbs_stack_format(obj.StackFormat()),
    )

def parse_fbs_viewport_style(obj: FBSDucViewportStyle) -> DS_DucViewportStyle:
    return DS_DucViewportStyle(
        scale_indicator_visible=obj.ScaleIndicatorVisible(),
    )

def parse_fbs_plot_style(obj: FBSDucPlotStyle) -> DS_DucPlotStyle:
    return DS_DucPlotStyle(
    )

def parse_fbs_xray_style(obj: FBSDucXRayStyle) -> DS_DucXRayStyle:
    return DS_DucXRayStyle(
        color=_s_req(obj.Color()),
    )

# =============================================================================
# Element definitions
# =============================================================================

def parse_fbs_rectangle(obj: FBSDucRectangleElement) -> DS_DucRectangleElement:
    return DS_DucRectangleElement(
        base=parse_fbs_duc_element_base(obj.Base())
    )

def parse_fbs_polygon(obj: FBSDucPolygonElement) -> DS_DucPolygonElement:
    return DS_DucPolygonElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        sides=obj.Sides(),
    )

def parse_fbs_ellipse(obj: FBSDucEllipseElement) -> DS_DucEllipseElement:
    return DS_DucEllipseElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        ratio=obj.Ratio(),
        start_angle=obj.StartAngle(),
        end_angle=obj.EndAngle(),
        show_aux_crosshair=obj.ShowAuxCrosshair(),
    )

def parse_fbs_embeddable(obj: FBSDucEmbeddableElement) -> DS_DucEmbeddableElement:
    return DS_DucEmbeddableElement(
        base=parse_fbs_duc_element_base(obj.Base())
    )

def parse_fbs_pdf(obj: FBSDucPdfElement) -> DS_DucPdfElement:
    return DS_DucPdfElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        file_id=_s(obj.FileId()),
    )

def parse_fbs_mermaid(obj: FBSDucMermaidElement) -> DS_DucMermaidElement:
    return DS_DucMermaidElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        source=_s_req(obj.Source()),
        theme=_s(obj.Theme()),
        svg_path=_s(obj.SvgPath()),
    )

def parse_fbs_table_column(obj: FBSDucTableColumn) -> DS_DucTableColumn:
    return DS_DucTableColumn(
        id=_s_req(obj.Id()),
        width=obj.Width(),
        style_overrides=parse_fbs_table_cell_style(obj.StyleOverrides()) if obj.StyleOverrides() else None,
    )

def parse_fbs_table_row(obj: FBSDucTableRow) -> DS_DucTableRow:
    return DS_DucTableRow(
        id=_s_req(obj.Id()),
        height=obj.Height(),
        style_overrides=parse_fbs_table_cell_style(obj.StyleOverrides()) if obj.StyleOverrides() else None,
    )

def parse_fbs_table_cell_span(obj: FBSDucTableCellSpan) -> Optional[DS_DucTableCellSpan]:
    if obj is None:
        return None
    return DS_DucTableCellSpan(
        columns=obj.Columns(),
        rows=obj.Rows(),
    )

def parse_fbs_table_cell(obj: FBSDucTableCell) -> DS_DucTableCell:
    return DS_DucTableCell(
        row_id=_s_req(obj.RowId()),
        column_id=_s_req(obj.ColumnId()),
        data=_s_req(obj.Data()),
        locked=obj.Locked(),
        span=parse_fbs_table_cell_span(obj.Span()) if obj.Span() else None,
        style_overrides=parse_fbs_table_cell_style(obj.StyleOverrides()) if obj.StyleOverrides() else None,
    )

def parse_fbs_table_column_entry(obj: FBSDucTableColumnEntry) -> DS_DucTableColumnEntry:
    return DS_DucTableColumnEntry(
        key=_s_req(obj.Key()),
        value=parse_fbs_table_column(obj.Value())
    )

def parse_fbs_table_row_entry(obj: FBSDucTableRowEntry) -> DS_DucTableRowEntry:
    return DS_DucTableRowEntry(
        key=_s_req(obj.Key()),
        value=parse_fbs_table_row(obj.Value())
    )

def parse_fbs_table_cell_entry(obj: FBSDucTableCellEntry) -> DS_DucTableCellEntry:
    return DS_DucTableCellEntry(
        key=_s_req(obj.Key()),
        value=parse_fbs_table_cell(obj.Value())
    )

def parse_fbs_table_auto_size(obj: FBSDucTableAutoSize) -> DS_DucTableAutoSize:
    return DS_DucTableAutoSize(
        columns=obj.Columns(),
        rows=obj.Rows(),
    )

def parse_fbs_table(obj: FBSDucTableElement) -> DS_DucTableElement:
    columns = [parse_fbs_table_column_entry(obj.Columns(i)) for i in range(obj.ColumnsLength())]
    rows = [parse_fbs_table_row_entry(obj.Rows(i)) for i in range(obj.RowsLength())]
    cells = [parse_fbs_table_cell_entry(obj.Cells(i)) for i in range(obj.CellsLength())]
    return DS_DucTableElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        style=parse_fbs_table_style(obj.Style()),
        column_order=_read_str_vector(obj, "ColumnOrderLength", "ColumnOrder"),
        row_order=_read_str_vector(obj, "RowOrderLength", "RowOrder"),
        columns=columns,
        rows=rows,
        cells=cells,
        header_row_count=obj.HeaderRowCount(),
        auto_size=parse_fbs_table_auto_size(obj.AutoSize()),
    )

def parse_fbs_image_crop(obj: FBSImageCrop) -> DS_ImageCrop:
    return DS_ImageCrop(
        x=obj.X(),
        y=obj.Y(),
        width=obj.Width(),
        height=obj.Height(),
        natural_width=obj.NaturalWidth(),
        natural_height=obj.NaturalHeight(),
    )

def parse_fbs_image(obj: FBSDucImageElement) -> DS_DucImageElement:
    scale = _read_double_vector(obj, "ScaleLength", "Scale")
    return DS_DucImageElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        scale=scale,
        status=obj.Status() if hasattr(obj, "Status") else None,
        file_id=_s(obj.FileId()),
        crop=parse_fbs_image_crop(obj.Crop()) if obj.Crop() else None,
        filter=parse_fbs_duc_image_filter(obj.Filter()) if obj.Filter() else None,
    )

def parse_fbs_text_dynamic_element_source(obj: FBSDucTextDynamicElementSource) -> DS_DucTextDynamicElementSource:
    return DS_DucTextDynamicElementSource(
        element_id=_s_req(obj.ElementId()),
        property=obj.Property() if hasattr(obj, "Property") else None,
    )

def parse_fbs_text_dynamic_dictionary_source(obj: FBSDucTextDynamicDictionarySource) -> DS_DucTextDynamicDictionarySource:
    return DS_DucTextDynamicDictionarySource(
        key=_s_req(obj.Key())
    )

def parse_fbs_text_dynamic_source(obj: FBSDucTextDynamicSource) -> DS_DucTextDynamicSource:
    # union data
    source_type = obj.TextSourceType() if hasattr(obj, "TextSourceType") else 0
    if source_type == 1:  # ELEMENT
        t = FBSDucTextDynamicElementSource()
        t.Init(obj.Source().Bytes, obj.Source().Pos)
        return DS_DucTextDynamicSource(source=parse_fbs_text_dynamic_element_source(t))
    elif source_type == 2:  # DICTIONARY
        t = FBSDucTextDynamicDictionarySource()
        t.Init(obj.Source().Bytes, obj.Source().Pos)
        return DS_DucTextDynamicSource(source=parse_fbs_text_dynamic_dictionary_source(t))
    else:
        return DS_DucTextDynamicSource(source=None)  # unexpected, but keep typing

def parse_fbs_primary_units(obj: FBSPrimaryUnits) -> DS_PrimaryUnits:
    # Implemented in Standards parsing (Part 2), but we may parse from either place consistently
    # We'll forward-declare here and override later if needed. For now, construct minimal.
    from ducpy.classes.StandardsClass import PrimaryUnits as DS_PrimaryUnits
    linear = None
    if obj.Linear():
        from ducpy.Duc.LinearUnitSystem import LinearUnitSystem as FBSLinearUnitSystem
        # full parse done later; here we just set to None to avoid circular.
    angular = None
    return DS_PrimaryUnits(linear=linear, angular=angular)

def parse_fbs_text_dynamic_part(obj: FBSDucTextDynamicPart) -> DS_DucTextDynamicPart:
    # For now, we don't parse the formatting since it's not a primary units object
    # This would need proper implementation based on the actual schema
    return DS_DucTextDynamicPart(
        tag=_s_req(obj.Tag()),
        source=parse_fbs_text_dynamic_source(obj.Source()),
        cached_value=_s_req(obj.CachedValue()),
        formatting=None,
    )

def parse_fbs_text(obj: FBSDucTextElement) -> DS_DucTextElement:
    dynamics = [parse_fbs_text_dynamic_part(obj.Dynamic(i)) for i in range(obj.DynamicLength())]
    return DS_DucTextElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        style=parse_fbs_duc_text_style(obj.Style()),
        text=_s_req(obj.Text()),
        dynamic=dynamics,
        auto_resize=obj.AutoResize(),
        original_text=_s_req(obj.OriginalText()),
        container_id=_s(obj.ContainerId()),
    )

def parse_fbs_linear(obj: FBSDucLinearElement) -> DS_DucLinearElement:
    return DS_DucLinearElement(
        linear_base=parse_fbs_duc_linear_element_base(obj.LinearBase()),
        wipeout_below=obj.WipeoutBelow(),
    )

def parse_fbs_arrow(obj: FBSDucArrowElement) -> DS_DucArrowElement:
    return DS_DucArrowElement(
        linear_base=parse_fbs_duc_linear_element_base(obj.LinearBase()),
        elbowed=obj.Elbowed(),
    )

def parse_fbs_free_draw_ends(obj: FBSDucFreeDrawEnds) -> DS_DucFreeDrawEnds:
    return DS_DucFreeDrawEnds(
        cap=obj.Cap(),
        taper=obj.Taper(),
        easing=_s_req(obj.Easing()),
    )

def parse_fbs_free_draw(obj: FBSDucFreeDrawElement) -> DS_DucFreeDrawElement:
    points = [parse_fbs_duc_point(obj.Points(i)) for i in range(obj.PointsLength())]
    pressures = _read_float_vector(obj, "PressuresLength", "Pressures")
    return DS_DucFreeDrawElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        points=points,
        size=obj.Size(),
        thinning=obj.Thinning(),
        smoothing=obj.Smoothing(),
        streamline=obj.Streamline(),
        easing=_s_req(obj.Easing()),
        pressures=pressures,
        simulate_pressure=obj.SimulatePressure(),
        last_committed_point=parse_fbs_duc_point(obj.LastCommittedPoint()) if obj.LastCommittedPoint() else None,
        start=parse_fbs_free_draw_ends(obj.Start()) if obj.Start() else None,
        end=parse_fbs_free_draw_ends(obj.End()) if obj.End() else None,
        svg_path=_s(obj.SvgPath()),
    )

def parse_fbs_block_duplication_array(obj: FBSDucBlockDuplicationArray) -> DS_DucBlockDuplicationArray:
    return DS_DucBlockDuplicationArray(
        rows=obj.Rows(),
        cols=obj.Cols(),
        row_spacing=obj.RowSpacing(),
        col_spacing=obj.ColSpacing(),
    )

def parse_fbs_block_instance(obj: FBSDucBlockInstanceElement) -> DS_DucBlockInstanceElement:
    element_overrides = [parse_fbs_string_value_entry(obj.ElementOverrides(i)) for i in range(obj.ElementOverridesLength())]
    attribute_values = [parse_fbs_string_value_entry(obj.AttributeValues(i)) for i in range(obj.AttributeValuesLength())]
    return DS_DucBlockInstanceElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        block_id=_s_req(obj.BlockId()),
        element_overrides=element_overrides if element_overrides else None,
        attribute_values=attribute_values if attribute_values else None,
        duplication_array=parse_fbs_block_duplication_array(obj.DuplicationArray()) if obj.DuplicationArray() else None,
    )

def parse_fbs_frame(obj: FBSDucFrameElement) -> DS_DucFrameElement:
    return DS_DucFrameElement(
        stack_element_base=parse_fbs_duc_stack_element_base(obj.StackElementBase())
    )

def parse_fbs_plot(obj: FBSDucPlotElement) -> DS_DucPlotElement:
    style = parse_fbs_plot_style(obj.Style())
    margins = parse_fbs_margins(obj.Layout().Margins())
    return DS_DucPlotElement(
        stack_element_base=parse_fbs_duc_stack_element_base(obj.StackElementBase()),
        style=style,
        layout=DS_PlotLayout(margins=margins),
    )

def parse_fbs_view(obj: FBSDucView):
    from ducpy.classes.ElementsClass import DucView as DS_DucView
    return DS_DucView(
        scroll_x=obj.ScrollX(),
        scroll_y=obj.ScrollY(),
        zoom=obj.Zoom(),
        twist_angle=obj.TwistAngle(),
        center_point=parse_fbs_duc_point(obj.CenterPoint()),
        scope=_s_req(obj.Scope()),
    )

def parse_fbs_viewport(obj: FBSDucViewportElement) -> DS_DucViewportElement:
    frozen = _read_str_vector(obj, "FrozenGroupIdsLength", "FrozenGroupIds")
    return DS_DucViewportElement(
        linear_base=parse_fbs_duc_linear_element_base(obj.LinearBase()),
        stack_base=parse_fbs_duc_stack_base(obj.StackBase()),
        style=parse_fbs_viewport_style(obj.Style()),
        view=parse_fbs_view(obj.View()),
        scale=obj.Scale(),
        shade_plot=obj.ShadePlot() if hasattr(obj, "ShadePlot") else None,
        frozen_group_ids=frozen,
        standard_override=_s(obj.StandardOverride()),
    )

def parse_fbs_xray(obj: FBSDucXRayElement) -> DS_DucXRayElement:
    return DS_DucXRayElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        style=parse_fbs_xray_style(obj.Style()),
        origin=parse_fbs_duc_point(obj.Origin()),
        direction=parse_fbs_duc_point(obj.Direction()),
        start_from_origin=obj.StartFromOrigin(),
    )

def parse_fbs_leader_content(obj: FBSLeaderContent) -> Optional[DS_LeaderContent]:
    if obj is None:
        return None
    content_type = obj.LeaderContentType() if hasattr(obj, "LeaderContentType") else 0
    union_type = obj.ContentType()
    table = Table(obj.Content().Bytes, obj.Content().Pos)
    content: Optional[Union[DS_LeaderTextBlockContent, DS_LeaderBlockContent]] = None
    if union_type == 0:  # LeaderTextBlockContent (first in union)
        t = FBSLeaderTextBlockContent()
        t.Init(table.Bytes, table.Pos)
        content = DS_LeaderTextBlockContent(text=_s_req(t.Text()))
    elif union_type == 1:  # LeaderBlockContent (second in union)
        t = FBSLeaderBlockContent()
        t.Init(table.Bytes, table.Pos)
        attr = [parse_fbs_string_value_entry(t.AttributeValues(i)) for i in range(t.AttributeValuesLength())]
        elem_over = [parse_fbs_string_value_entry(t.ElementOverrides(i)) for i in range(t.ElementOverridesLength())]
        content = DS_LeaderBlockContent(
            block_id=_s_req(t.BlockId()),
            attribute_values=attr if attr else None,
            element_overrides=elem_over if elem_over else None,
        )
    return DS_LeaderContent(content=content)

def parse_fbs_leader(obj: FBSDucLeaderElement) -> DS_DucLeaderElement:
    ca = obj.ContentAnchor()
    return DS_DucLeaderElement(
        linear_base=parse_fbs_duc_linear_element_base(obj.LinearBase()),
        style=parse_fbs_leader_style(obj.Style()),
        content=parse_fbs_leader_content(obj.Content()) if obj.Content() else None,
        content_anchor=DS_GeometricPoint(x=ca.X(), y=ca.Y()) if ca else DS_GeometricPoint(x=0.0, y=0.0),
    )

def parse_fbs_dimension_definition_points(obj: FBSDimensionDefinitionPoints) -> DS_DimensionDefinitionPoints:
    return DS_DimensionDefinitionPoints(
        origin1=_geopoint_struct_to_ds(obj.Origin1()),
        location=_geopoint_struct_to_ds(obj.Location()),
        origin2=_geopoint_struct_to_ds(obj.Origin2()),
        center=_geopoint_struct_to_ds(obj.Center()),
        jog=_geopoint_struct_to_ds(obj.Jog()),
    )

def parse_fbs_dimension_bindings(obj: FBSDimensionBindings) -> Optional[DS_DimensionBindings]:
    if obj is None:
        return None
    return DS_DimensionBindings(
        origin1=parse_fbs_duc_point_binding(obj.Origin1()) if obj.Origin1() else None,
        origin2=parse_fbs_duc_point_binding(obj.Origin2()) if obj.Origin2() else None,
        center=parse_fbs_duc_point_binding(obj.Center()) if obj.Center() else None,
    )

def parse_fbs_dimension_baseline(obj: FBSDimensionBaselineData) -> Optional[DS_DimensionBaselineData]:
    if obj is None:
        return None
    return DS_DimensionBaselineData(
        base_dimension_id=_s(obj.BaseDimensionId())
    )

def parse_fbs_dimension_continue(obj: FBSDimensionContinueData) -> Optional[DS_DimensionContinueData]:
    if obj is None:
        return None
    return DS_DimensionContinueData(
        continue_from_dimension_id=_s(obj.ContinueFromDimensionId())
    )

def parse_fbs_datum_reference(obj: FBSDatumReference) -> DS_DatumReference:
    return DS_DatumReference(
        letters=_s_req(obj.Letters()),
        modifier=obj.Modifier() if hasattr(obj, "Modifier") else None,
    )

def parse_fbs_tolerance_clause(obj: FBSToleranceClause) -> DS_ToleranceClause:
    feature_mods = _read_int_vector(obj, "FeatureModifiersLength", "FeatureModifiers")
    return DS_ToleranceClause(
        value=_s_req(obj.Value()),
        feature_modifiers=feature_mods,
        zone_type=obj.ZoneType() if hasattr(obj, "ZoneType") else None,
        material_condition=obj.MaterialCondition() if hasattr(obj, "MaterialCondition") else None,
    )

def parse_fbs_fcf_segment(obj: FBSFeatureControlFrameSegment) -> DS_FeatureControlFrameSegment:
    tol = parse_fbs_tolerance_clause(obj.Tolerance())
    datums = [parse_fbs_datum_reference(obj.Datums(i)) for i in range(obj.DatumsLength())]
    return DS_FeatureControlFrameSegment(
        tolerance=tol,
        datums=datums,
        symbol=obj.Symbol() if hasattr(obj, "Symbol") else None,
    )

def parse_fbs_fcf_between_modifier(obj: FBSFCFBetweenModifier) -> Optional[DS_FCFBetweenModifier]:
    if obj is None:
        return None
    return DS_FCFBetweenModifier(
        start=_s_req(obj.Start()),
        end=_s_req(obj.End()),
    )

def parse_fbs_fcf_projected_zone_modifier(obj: FBSFCFProjectedZoneModifier) -> Optional[DS_FCFProjectedZoneModifier]:
    if obj is None:
        return None
    return DS_FCFProjectedZoneModifier(
        value=obj.Value()
    )

def parse_fbs_fcf_frame_modifiers(obj: FBSFCFFrameModifiers) -> Optional[DS_FCFFrameModifiers]:
    if obj is None:
        return None
    return DS_FCFFrameModifiers(
        between=parse_fbs_fcf_between_modifier(obj.Between()) if obj.Between() else None,
        projected_tolerance_zone=parse_fbs_fcf_projected_zone_modifier(obj.ProjectedToleranceZone()) if obj.ProjectedToleranceZone() else None,
        all_around=obj.AllAround() if hasattr(obj, "AllAround") else None,
        all_over=obj.AllOver() if hasattr(obj, "AllOver") else None,
        continuous_feature=obj.ContinuousFeature() if hasattr(obj, "ContinuousFeature") else None,
    )

def parse_fbs_fcf_datum_definition(obj: FBSFCFDatumDefinition) -> Optional[DS_FCFDatumDefinition]:
    if obj is None:
        return None
    return DS_FCFDatumDefinition(
        letter=_s_req(obj.Letter()),
        feature_binding=parse_fbs_duc_point_binding(obj.FeatureBinding()) if obj.FeatureBinding() else None,
    )

def parse_fbs_fcf_segment_row(obj: FBSFCFSegmentRow) -> DS_FCFSegmentRow:
    segs = [parse_fbs_fcf_segment(obj.Segments(i)) for i in range(obj.SegmentsLength())]
    return DS_FCFSegmentRow(
        segments=segs
    )

def parse_fbs_feature_control_frame(obj: FBSDucFeatureControlFrameElement) -> DS_DucFeatureControlFrameElement:
    rows = [parse_fbs_fcf_segment_row(obj.Rows(i)) for i in range(obj.RowsLength())]
    return DS_DucFeatureControlFrameElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        style=parse_fbs_feature_control_frame_style(obj.Style()),
        rows=rows,
        frame_modifiers=parse_fbs_fcf_frame_modifiers(obj.FrameModifiers()) if obj.FrameModifiers() else None,
        leader_element_id=_s(obj.LeaderElementId()),
        datum_definition=parse_fbs_fcf_datum_definition(obj.DatumDefinition()) if obj.DatumDefinition() else None,
    )

def parse_fbs_text_column(obj: FBSTextColumn) -> DS_TextColumn:
    return DS_TextColumn(
        width=obj.Width(),
        gutter=obj.Gutter(),
    )

def parse_fbs_column_layout(obj: FBSColumnLayout) -> DS_ColumnLayout:
    defs = [parse_fbs_text_column(obj.Definitions(i)) for i in range(obj.DefinitionsLength())]
    return DS_ColumnLayout(
        definitions=defs,
        auto_height=obj.AutoHeight(),
        type=obj.Type() if hasattr(obj, "Type") else None,
    )

def parse_fbs_doc(obj: FBSDucDocElement) -> DS_DucDocElement:
    dynamics = [parse_fbs_text_dynamic_part(obj.Dynamic(i)) for i in range(obj.DynamicLength())]
    return DS_DucDocElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        style=parse_fbs_doc_style(obj.Style()),
        text=_s_req(obj.Text()),
        dynamic=dynamics,
        columns=parse_fbs_column_layout(obj.Columns()),
        auto_resize=obj.AutoResize(),
        flow_direction=obj.FlowDirection() if hasattr(obj, "FlowDirection") else None,
    )

def parse_fbs_parametric_source(obj: FBSParametricSource) -> DS_ParametricSource:
    return DS_ParametricSource(
        type=obj.Type() if hasattr(obj, "Type") else None,
        code=_s(obj.Code()),
        file_id=_s(obj.FileId()),
    )

def parse_fbs_parametric(obj: FBSDucParametricElement) -> DS_DucParametricElement:
    return DS_DucParametricElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        source=parse_fbs_parametric_source(obj.Source())
    )

# =============================================================================
# Element union and wrapper
# =============================================================================

def parse_duc_element_wrapper(obj: FBSElementWrapper) -> DS_ElementWrapper:
    typ = obj.ElementType()
    tbl = Table(obj.Element().Bytes, obj.Element().Pos)

    if typ == FBS_Element.Element.DucRectangleElement:
        x = FBSDucRectangleElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_rectangle(x)
    elif typ == FBS_Element.Element.DucPolygonElement:
        x = FBSDucPolygonElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_polygon(x)
    elif typ == FBS_Element.Element.DucEllipseElement:
        x = FBSDucEllipseElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_ellipse(x)
    elif typ == FBS_Element.Element.DucEmbeddableElement:
        x = FBSDucEmbeddableElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_embeddable(x)
    elif typ == FBS_Element.Element.DucPdfElement:
        x = FBSDucPdfElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_pdf(x)
    elif typ == FBS_Element.Element.DucMermaidElement:
        x = FBSDucMermaidElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_mermaid(x)
    elif typ == FBS_Element.Element.DucTableElement:
        x = FBSDucTableElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_table(x)
    elif typ == FBS_Element.Element.DucImageElement:
        x = FBSDucImageElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_image(x)
    elif typ == FBS_Element.Element.DucTextElement:
        x = FBSDucTextElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_text(x)
    elif typ == FBS_Element.Element.DucLinearElement:
        x = FBSDucLinearElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_linear(x)
    elif typ == FBS_Element.Element.DucArrowElement:
        x = FBSDucArrowElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_arrow(x)
    elif typ == FBS_Element.Element.DucFreeDrawElement:
        x = FBSDucFreeDrawElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_free_draw(x)
    elif typ == FBS_Element.Element.DucBlockInstanceElement:
        x = FBSDucBlockInstanceElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_block_instance(x)
    elif typ == FBS_Element.Element.DucFrameElement:
        x = FBSDucFrameElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_frame(x)
    elif typ == FBS_Element.Element.DucPlotElement:
        x = FBSDucPlotElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_plot(x)
    elif typ == FBS_Element.Element.DucViewportElement:
        x = FBSDucViewportElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_viewport(x)
    elif typ == FBS_Element.Element.DucXRayElement:
        x = FBSDucXRayElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_xray(x)
    elif typ == FBS_Element.Element.DucLeaderElement:
        x = FBSDucLeaderElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_leader(x)
    elif typ == FBS_Element.Element.DucDimensionElement:
        x = FBSDucDimensionElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_dimension(x)
    elif typ == FBS_Element.Element.DucFeatureControlFrameElement:
        x = FBSDucFeatureControlFrameElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_feature_control_frame(x)
    elif typ == FBS_Element.Element.DucDocElement:
        x = FBSDucDocElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_doc(x)
    elif typ == FBS_Element.Element.DucParametricElement:
        x = FBSDucParametricElement(); x.Init(tbl.Bytes, tbl.Pos); el = parse_fbs_parametric(x)
    else:
        raise ValueError(f"Unknown Element union type: {typ}")

    return DS_ElementWrapper(element=el)

def parse_fbs_dimension(obj: FBSDucDimensionElement) -> DS_DucDimensionElement:
    return DS_DucDimensionElement(
        base=parse_fbs_duc_element_base(obj.Base()),
        style=parse_fbs_dimension_style(obj.Style()),
        definition_points=parse_fbs_dimension_definition_points(obj.DefinitionPoints()),
        oblique_angle=obj.ObliqueAngle(),
        dimension_type=obj.DimensionType() if hasattr(obj, "DimensionType") else None,
        ordinate_axis=obj.OrdinateAxis() if hasattr(obj, "OrdinateAxis") else None,
        bindings=parse_fbs_dimension_bindings(obj.Bindings()) if obj.Bindings() else None,
        text_override=_s(obj.TextOverride()),
        text_position=_geopoint_struct_to_ds(obj.TextPosition()),
        tolerance_override=parse_fbs_dimension_tolerance_style(obj.ToleranceOverride()) if obj.ToleranceOverride() else None,
        baseline_data=parse_fbs_dimension_baseline(obj.BaselineData()) if obj.BaselineData() else None,
        continue_data=parse_fbs_dimension_continue(obj.ContinueData()) if obj.ContinueData() else None,
    )

# ============================
# Part 2/6 continues here
# ============================

# ------------------------------
# Blocks, groups, regions, layers
# ------------------------------

def parse_fbs_duc_block_attribute_definition(obj: FBSDucBlockAttributeDefinition) -> DS_DucBlockAttributeDefinition:
    return DS_DucBlockAttributeDefinition(
        tag=_s_req(obj.Tag()),
        default_value=_s_req(obj.DefaultValue()),
        is_constant=obj.IsConstant(),
        prompt=_s(obj.Prompt()),
    )

def parse_fbs_duc_block_attribute_definition_entry(obj: FBSDucBlockAttributeDefinitionEntry) -> DS_DucBlockAttributeDefinitionEntry:
    return DS_DucBlockAttributeDefinitionEntry(
        key=_s_req(obj.Key()),
        value=parse_fbs_duc_block_attribute_definition(obj.Value()),
    )

def parse_fbs_duc_block_metadata(obj: FBSDucBlockMetadata) -> DS_DucBlockMetadata:
    return DS_DucBlockMetadata(
        source=_s_req(obj.Source()),
        usage_count=obj.UsageCount(),
        created_at=obj.CreatedAt(),
        updated_at=obj.UpdatedAt(),
        localization=_s(obj.Localization()),
    )

def parse_fbs_duc_block(obj: FBSDucBlock) -> DS_DucBlock:
    attrs = [parse_fbs_duc_block_attribute_definition_entry(obj.AttributeDefinitions(i)) for i in range(obj.AttributeDefinitionsLength())]

    metadata = None
    if hasattr(obj, 'Metadata') and obj.Metadata():
        metadata = parse_fbs_duc_block_metadata(obj.Metadata())

    thumbnail = None
    if hasattr(obj, 'Thumbnail') and obj.ThumbnailLength() > 0:
        thumbnail = obj.ThumbnailAsBytes()

    return DS_DucBlock(
        id=_s_req(obj.Id()),
        label=_s_req(obj.Label()),
        version=obj.Version(),
        attribute_definitions=attrs,
        description=_s(obj.Description()),
        metadata=metadata,
        thumbnail=thumbnail,
    )

def parse_fbs_duc_group(obj: FBSDucGroup) -> DS_DucGroup:
    return DS_DucGroup(
        id=_s_req(obj.Id()),
        stack_base=parse_fbs_duc_stack_base(obj.StackBase())
    )

def parse_fbs_duc_region(obj: FBSDucRegion) -> DS_DucRegion:
    return DS_DucRegion(
        id=_s_req(obj.Id()),
        stack_base=parse_fbs_duc_stack_base(obj.StackBase()),
        boolean_operation=obj.BooleanOperation() if hasattr(obj, "BooleanOperation") else None,
    )

def parse_fbs_duc_layer_overrides(obj: FBSDucLayerOverrides) -> DS_DucLayerOverrides:
    return DS_DucLayerOverrides(
        stroke=parse_fbs_element_stroke(obj.Stroke()),
        background=parse_fbs_element_background(obj.Background()),
    )

def parse_fbs_duc_layer(obj: FBSDucLayer) -> DS_DucLayer:
    return DS_DucLayer(
        id=_s_req(obj.Id()),
        stack_base=parse_fbs_duc_stack_base(obj.StackBase()),
        readonly=obj.Readonly(),
        overrides=parse_fbs_duc_layer_overrides(obj.Overrides())
    )

# ------------------------------
# Standards: units and overrides
# ------------------------------

def parse_fbs_unit_system_base(obj: FBS_UnitSystemBase) -> DS_UnitSystemBase:
    return DS_UnitSystemBase(
        precision=obj.Precision(),
        suppress_leading_zeros=obj.SuppressLeadingZeros(),
        suppress_trailing_zeros=obj.SuppressTrailingZeros(),
        system=obj.System() if hasattr(obj, "System") else None,
    )

def parse_fbs_linear_unit_system(obj: FBSLinearUnitSystem) -> Optional[DS_LinearUnitSystem]:
    if obj is None:
        return None
    base = obj.Base()
    base_ds = parse_fbs_unit_system_base(base)
    return DS_LinearUnitSystem(
        precision=base_ds.precision,
        suppress_leading_zeros=base_ds.suppress_leading_zeros,
        suppress_trailing_zeros=base_ds.suppress_trailing_zeros,
        system=base_ds.system,
        suppress_zero_feet=obj.SuppressZeroFeet(),
        suppress_zero_inches=obj.SuppressZeroInches(),
        format=obj.Format() if hasattr(obj, "Format") else None,
        decimal_separator=obj.DecimalSeparator() if hasattr(obj, "DecimalSeparator") else None,
    )

def parse_fbs_angular_unit_system(obj: FBSAngularUnitSystem) -> Optional[DS_AngularUnitSystem]:
    if obj is None:
        return None
    base = obj.Base()
    base_ds = parse_fbs_unit_system_base(base)
    return DS_AngularUnitSystem(
        precision=base_ds.precision,
        suppress_leading_zeros=base_ds.suppress_leading_zeros,
        suppress_trailing_zeros=base_ds.suppress_trailing_zeros,
        system=base_ds.system,
        format=obj.Format() if hasattr(obj, "Format") else None,
    )

def parse_fbs_alternate_units(obj: FBSAlternateUnits) -> Optional[DS_AlternateUnits]:
    if obj is None:
        return None
    base = obj.Base()
    base_ds = parse_fbs_unit_system_base(base)
    return DS_AlternateUnits(
        precision=base_ds.precision,
        suppress_leading_zeros=base_ds.suppress_leading_zeros,
        suppress_trailing_zeros=base_ds.suppress_trailing_zeros,
        system=base_ds.system,
        is_visible=obj.IsVisible(),
        multiplier=obj.Multiplier(),
        format=obj.Format() if hasattr(obj, "Format") else None,
    )

def parse_fbs_primary_units(obj: FBSPrimaryUnits) -> DS_PrimaryUnits:
    return DS_PrimaryUnits(
        linear=parse_fbs_linear_unit_system(obj.Linear()) if obj.Linear() else None,
        angular=parse_fbs_angular_unit_system(obj.Angular()) if obj.Angular() else None,
    )

def parse_fbs_standard_units(obj: FBSStandardUnits) -> Optional[DS_StandardUnits]:
    if obj is None:
        return None
    return DS_StandardUnits(
        primary_units=parse_fbs_primary_units(obj.PrimaryUnits()) if obj.PrimaryUnits() else DS_PrimaryUnits(None, None),
        alternate_units=parse_fbs_alternate_units(obj.AlternateUnits()) if obj.AlternateUnits() else None,
    )

def parse_fbs_unit_precision(obj: FBSUnitPrecision) -> Optional[DS_UnitPrecision]:
    if obj is None:
        return None
    return DS_UnitPrecision(
        linear=obj.Linear(),
        angular=obj.Angular(),
        area=obj.Area(),
        volume=obj.Volume(),
    )

def parse_fbs_standard_overrides(obj: FBSStandardOverrides) -> Optional[DS_StandardOverrides]:
    if obj is None:
        return None
    active_grid = _read_str_vector(obj, "ActiveGridSettingsIdLength", "ActiveGridSettingsId")
    return DS_StandardOverrides(
        unit_precision=parse_fbs_unit_precision(obj.UnitPrecision()) if obj.UnitPrecision() else None,
        main_scope=_s(obj.MainScope()),
        elements_stroke_width_override=obj.ElementsStrokeWidthOverride() if hasattr(obj, "ElementsStrokeWidthOverride") else None,
        common_style_id=_s(obj.CommonStyleId()),
        stack_like_style_id=_s(obj.StackLikeStyleId()),
        text_style_id=_s(obj.TextStyleId()),
        dimension_style_id=_s(obj.DimensionStyleId()),
        leader_style_id=_s(obj.LeaderStyleId()),
        feature_control_frame_style_id=_s(obj.FeatureControlFrameStyleId()),
        table_style_id=_s(obj.TableStyleId()),
        doc_style_id=_s(obj.DocStyleId()),
        viewport_style_id=_s(obj.ViewportStyleId()),
        plot_style_id=_s(obj.PlotStyleId()),
        hatch_style_id=_s(obj.HatchStyleId()),
        active_grid_settings_id=active_grid if active_grid else None,
        active_snap_settings_id=_s(obj.ActiveSnapSettingsId()),
        dash_line_override=_s(obj.DashLineOverride()),
    )

# ------------------------------
# Standards: styles
# ------------------------------

def parse_fbs_common_style(obj: FBSDucCommonStyle) -> DS_DucCommonStyle:
    return DS_DucCommonStyle(
        background=parse_fbs_element_background(obj.Background()),
        stroke=parse_fbs_element_stroke(obj.Stroke()),
    )

def parse_fbs_identified_common_style(obj: FBSIdentifiedCommonStyle) -> DS_IdentifiedCommonStyle:
    return DS_IdentifiedCommonStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_common_style(obj.Style()),
    )

def parse_fbs_identified_stack_like_style(obj: FBSIdentifiedStackLikeStyle) -> DS_IdentifiedStackLikeStyle:
    return DS_IdentifiedStackLikeStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_duc_stack_like_styles(obj.Style()),
    )

def parse_fbs_identified_text_style(obj: FBSIdentifiedTextStyle) -> DS_IdentifiedTextStyle:
    return DS_IdentifiedTextStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_duc_text_style(obj.Style()),
    )

def parse_fbs_identified_dimension_style(obj: FBSIdentifiedDimensionStyle) -> DS_IdentifiedDimensionStyle:
    return DS_IdentifiedDimensionStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_dimension_style(obj.Style()),
    )

def parse_fbs_identified_leader_style(obj: FBSIdentifiedLeaderStyle) -> DS_IdentifiedLeaderStyle:
    return DS_IdentifiedLeaderStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_leader_style(obj.Style()),
    )

def parse_fbs_identified_fcf_style(obj: FBSIdentifiedFCFStyle) -> DS_IdentifiedFCFStyle:
    return DS_IdentifiedFCFStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_feature_control_frame_style(obj.Style()),
    )

def parse_fbs_identified_table_style(obj: FBSIdentifiedTableStyle) -> DS_IdentifiedTableStyle:
    return DS_IdentifiedTableStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_table_style(obj.Style()),
    )

def parse_fbs_identified_doc_style(obj: FBSIdentifiedDocStyle) -> DS_IdentifiedDocStyle:
    return DS_IdentifiedDocStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_doc_style(obj.Style()),
    )

def parse_fbs_identified_viewport_style(obj: FBSIdentifiedViewportStyle) -> DS_IdentifiedViewportStyle:
    return DS_IdentifiedViewportStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_viewport_style(obj.Style()),
    )

def parse_fbs_identified_hatch_style(obj: FBSIdentifiedHatchStyle) -> DS_IdentifiedHatchStyle:
    return DS_IdentifiedHatchStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_duc_hatch_style(obj.Style()),
    )

def parse_fbs_identified_xray_style(obj: FBSIdentifiedXRayStyle) -> DS_IdentifiedXRayStyle:
    return DS_IdentifiedXRayStyle(
        id=parse_fbs_identifier(obj.Id()),
        style=parse_fbs_xray_style(obj.Style()),
    )

def parse_fbs_standard_styles(obj: FBSStandardStyles) -> Optional[DS_StandardStyles]:
    if obj is None:
        return None
    common = [parse_fbs_identified_common_style(obj.CommonStyles(i)) for i in range(obj.CommonStylesLength())]
    stack_like = [parse_fbs_identified_stack_like_style(obj.StackLikeStyles(i)) for i in range(obj.StackLikeStylesLength())]
    text = [parse_fbs_identified_text_style(obj.TextStyles(i)) for i in range(obj.TextStylesLength())]
    dim = [parse_fbs_identified_dimension_style(obj.DimensionStyles(i)) for i in range(obj.DimensionStylesLength())]
    leader = [parse_fbs_identified_leader_style(obj.LeaderStyles(i)) for i in range(obj.LeaderStylesLength())]
    fcf = [parse_fbs_identified_fcf_style(obj.FeatureControlFrameStyles(i)) for i in range(obj.FeatureControlFrameStylesLength())]
    table = [parse_fbs_identified_table_style(obj.TableStyles(i)) for i in range(obj.TableStylesLength())]
    doc = [parse_fbs_identified_doc_style(obj.DocStyles(i)) for i in range(obj.DocStylesLength())]
    viewport = [parse_fbs_identified_viewport_style(obj.ViewportStyles(i)) for i in range(obj.ViewportStylesLength())]
    hatch = [parse_fbs_identified_hatch_style(obj.HatchStyles(i)) for i in range(obj.HatchStylesLength())]
    xray = [parse_fbs_identified_xray_style(obj.XrayStyles(i)) for i in range(obj.XrayStylesLength())]
    return DS_StandardStyles(
        common_styles=common,
        stack_like_styles=stack_like,
        text_styles=text,
        dimension_styles=dim,
        leader_styles=leader,
        feature_control_frame_styles=fcf,
        table_styles=table,
        doc_styles=doc,
        viewport_styles=viewport,
        hatch_styles=hatch,
        xray_styles=xray,
    )

# ------------------------------
# Standards: view settings
# ------------------------------

# bring DS_DucUcs and DS_DucView into scope
from ducpy.classes.ElementsClass import DucUcs as DS_DucUcs, DucView as DS_DucView

def parse_fbs_duc_ucs(obj: FBSDucUcs) -> DS_DucUcs:
    origin = obj.Origin()
    return DS_DucUcs(
        origin=DS_GeometricPoint(x=origin.X(), y=origin.Y()) if origin else DS_GeometricPoint(0.0, 0.0),
        angle=obj.Angle(),
    )

def parse_fbs_grid_style(obj: FBSGridStyle) -> DS_GridStyle:
    return DS_GridStyle(
        color=_s_req(obj.Color()),
        opacity=obj.Opacity(),
        dash_pattern=_read_double_vector(obj, "DashPatternLength", "DashPattern"),
    )

def parse_fbs_polar_grid_settings(obj: FBSPolarGridSettings) -> Optional[DS_PolarGridSettings]:
    if obj is None:
        return None
    return DS_PolarGridSettings(
        radial_divisions=obj.RadialDivisions(),
        radial_spacing=obj.RadialSpacing(),
        show_labels=obj.ShowLabels(),
    )

def parse_fbs_isometric_grid_settings(obj: FBSIsometricGridSettings) -> Optional[DS_IsometricGridSettings]:
    if obj is None:
        return None
    return DS_IsometricGridSettings(
        left_angle=obj.LeftAngle(),
        right_angle=obj.RightAngle(),
    )

def parse_fbs_grid_settings(obj: FBSGridSettings) -> DS_GridSettings:
    origin = obj.Origin()
    return DS_GridSettings(
        is_adaptive=obj.IsAdaptive(),
        x_spacing=obj.XSpacing(),
        y_spacing=obj.YSpacing(),
        subdivisions=obj.Subdivisions(),
        origin=DS_GeometricPoint(x=origin.X(), y=origin.Y()) if origin else DS_GeometricPoint(0.0, 0.0),
        rotation=obj.Rotation(),
        follow_ucs=obj.FollowUcs(),
        major_style=parse_fbs_grid_style(obj.MajorStyle()),
        minor_style=parse_fbs_grid_style(obj.MinorStyle()),
        show_minor=obj.ShowMinor(),
        min_zoom=obj.MinZoom(),
        max_zoom=obj.MaxZoom(),
        auto_hide=obj.AutoHide(),
        enable_snapping=obj.EnableSnapping(),
        readonly=obj.Readonly(),
        type=obj.Type() if hasattr(obj, "Type") else None,
        display_type=obj.DisplayType() if hasattr(obj, "DisplayType") else None,
        polar_settings=parse_fbs_polar_grid_settings(obj.PolarSettings()) if obj.PolarSettings() else None,
        isometric_settings=parse_fbs_isometric_grid_settings(obj.IsometricSettings()) if obj.IsometricSettings() else None,
    )

def parse_fbs_snap_override(obj: FBSSnapOverride) -> DS_SnapOverride:
    return DS_SnapOverride(
        key=_s_req(obj.Key()),
        behavior=obj.Behavior() if hasattr(obj, "Behavior") else None,
    )

def parse_fbs_dynamic_snap_settings(obj: FBSDynamicSnapSettings) -> DS_DynamicSnapSettings:
    return DS_DynamicSnapSettings(
        enabled_during_drag=obj.EnabledDuringDrag(),
        enabled_during_rotation=obj.EnabledDuringRotation(),
        enabled_during_scale=obj.EnabledDuringScale(),
    )

def parse_fbs_tracking_line_style(obj: FBSTrackingLineStyle) -> Optional[DS_TrackingLineStyle]:
    if obj is None:
        return None
    return DS_TrackingLineStyle(
        color=_s_req(obj.Color()),
        opacity=obj.Opacity(),
        dash_pattern=_read_double_vector(obj, "DashPatternLength", "DashPattern"),
    )

def parse_fbs_polar_tracking_settings(obj: FBSPolarTrackingSettings) -> DS_PolarTrackingSettings:
    return DS_PolarTrackingSettings(
        enabled=obj.Enabled(),
        angles=_read_double_vector(obj, "AnglesLength", "Angles"),
        track_from_last_point=obj.TrackFromLastPoint(),
        show_polar_coordinates=obj.ShowPolarCoordinates(),
        increment_angle=obj.IncrementAngle() if hasattr(obj, "IncrementAngle") else None,
    )

def parse_fbs_layer_snap_filters(obj: FBSLayerSnapFilters) -> Optional[DS_LayerSnapFilters]:
    if obj is None:
        return None
    return DS_LayerSnapFilters(
        include_layers=_read_str_vector(obj, "IncludeLayersLength", "IncludeLayers"),
        exclude_layers=_read_str_vector(obj, "ExcludeLayersLength", "ExcludeLayers"),
    )

def parse_fbs_snap_marker_style(obj: FBSSnapMarkerStyle) -> DS_SnapMarkerStyle:
    return DS_SnapMarkerStyle(
        shape=obj.Shape() if hasattr(obj, "Shape") else None,
        color=_s_req(obj.Color()),
    )

def parse_fbs_snap_marker_style_entry(obj: FBSSnapMarkerStyleEntry) -> DS_SnapMarkerStyleEntry:
    return DS_SnapMarkerStyleEntry(
        key=obj.Key() if hasattr(obj, "Key") else None,
        value=parse_fbs_snap_marker_style(obj.Value())
    )

def parse_fbs_snap_marker_settings(obj: FBSSnapMarkerSettings) -> DS_SnapMarkerSettings:
    styles = [parse_fbs_snap_marker_style_entry(obj.Styles(i)) for i in range(obj.StylesLength())]
    return DS_SnapMarkerSettings(
        enabled=obj.Enabled(),
        size=obj.Size(),
        styles=styles,
        duration=obj.Duration() if hasattr(obj, "Duration") else None,
    )

def parse_fbs_snap_settings(obj: FBSSnapSettings) -> DS_SnapSettings:
    active_modes = _read_int_vector(obj, "ActiveObjectSnapModesLength", "ActiveObjectSnapModes")
    snap_priority = _read_int_vector(obj, "SnapPriorityLength", "SnapPriority")
    overrides = [parse_fbs_snap_override(obj.TemporaryOverrides(i)) for i in range(obj.TemporaryOverridesLength())]
    el_types = _read_str_vector(obj, "ElementTypeFiltersLength", "ElementTypeFilters")
    return DS_SnapSettings(
        readonly=obj.Readonly(),
        twist_angle=obj.TwistAngle(),
        snap_tolerance=obj.SnapTolerance(),
        object_snap_aperture=obj.ObjectSnapAperture(),
        is_ortho_mode_on=obj.IsOrthoModeOn(),
        polar_tracking=parse_fbs_polar_tracking_settings(obj.PolarTracking()),
        is_object_snap_on=obj.IsObjectSnapOn(),
        active_object_snap_modes=active_modes,
        snap_priority=snap_priority,
        show_tracking_lines=obj.ShowTrackingLines(),
        dynamic_snap=parse_fbs_dynamic_snap_settings(obj.DynamicSnap()),
        snap_markers=parse_fbs_snap_marker_settings(obj.SnapMarkers()),
        construction_snap_enabled=obj.ConstructionSnapEnabled(),
        tracking_line_style=parse_fbs_tracking_line_style(obj.TrackingLineStyle()) if obj.TrackingLineStyle() else None,
        temporary_overrides=overrides if overrides else None,
        incremental_distance=obj.IncrementalDistance() if hasattr(obj, "IncrementalDistance") else None,
        magnetic_strength=obj.MagneticStrength() if hasattr(obj, "MagneticStrength") else None,
        layer_snap_filters=parse_fbs_layer_snap_filters(obj.LayerSnapFilters()) if obj.LayerSnapFilters() else None,
        element_type_filters=el_types if el_types else None,
        snap_mode=obj.SnapMode() if hasattr(obj, "SnapMode") else None,
        snap_to_grid_intersections=obj.SnapToGridIntersections() if hasattr(obj, "SnapToGridIntersections") else None,
    )

def parse_fbs_identified_grid_settings(obj: FBSIdentifiedGridSettings) -> DS_IdentifiedGridSettings:
    return DS_IdentifiedGridSettings(
        id=parse_fbs_identifier(obj.Id()),
        settings=parse_fbs_grid_settings(obj.Settings())
    )

def parse_fbs_identified_snap_settings(obj: FBSIdentifiedSnapSettings) -> DS_IdentifiedSnapSettings:
    return DS_IdentifiedSnapSettings(
        id=parse_fbs_identifier(obj.Id()),
        settings=parse_fbs_snap_settings(obj.Settings())
    )

def parse_fbs_identified_ucs(obj: FBSIdentifiedUcs) -> DS_IdentifiedUcs:
    return DS_IdentifiedUcs(
        id=parse_fbs_identifier(obj.Id()),
        ucs=parse_fbs_duc_ucs(obj.Ucs())
    )

def parse_fbs_identified_view(obj: FBSIdentifiedView) -> DS_IdentifiedView:
    return DS_IdentifiedView(
        id=parse_fbs_identifier(obj.Id()),
        view=parse_fbs_view(obj.View())
    )

def parse_fbs_standard_view_settings(obj: FBSStandardViewSettings) -> Optional[DS_StandardViewSettings]:
    if obj is None:
        return None
    views = [parse_fbs_identified_view(obj.Views(i)) for i in range(obj.ViewsLength())]
    ucs = [parse_fbs_identified_ucs(obj.Ucs(i)) for i in range(obj.UcsLength())]
    grids = [parse_fbs_identified_grid_settings(obj.GridSettings(i)) for i in range(obj.GridSettingsLength())]
    snaps = [parse_fbs_identified_snap_settings(obj.SnapSettings(i)) for i in range(obj.SnapSettingsLength())]
    return DS_StandardViewSettings(
        views=views,
        ucs=ucs,
        grid_settings=grids,
        snap_settings=snaps,
    )

# ------------------------------
# Standards: validation
# ------------------------------

def parse_fbs_dimension_validation_rules(obj: FBSDimensionValidationRules) -> Optional[DS_DimensionValidationRules]:
    if obj is None:
        return None
    return DS_DimensionValidationRules(
        min_text_height=obj.MinTextHeight(),
        max_text_height=obj.MaxTextHeight(),
        allowed_precisions=_read_int_vector(obj, "AllowedPrecisionsLength", "AllowedPrecisions"),
    )

def parse_fbs_layer_validation_rules(obj: FBSLayerValidationRules) -> Optional[DS_LayerValidationRules]:
    if obj is None:
        return None
    return DS_LayerValidationRules(
        prohibited_layer_names=_read_str_vector(obj, "ProhibitedLayerNamesLength", "ProhibitedLayerNames")
    )

def parse_fbs_standard_validation(obj: FBSStandardValidation) -> Optional[DS_StandardValidation]:
    if obj is None:
        return None
    return DS_StandardValidation(
        dimension_rules=parse_fbs_dimension_validation_rules(obj.DimensionRules()) if obj.DimensionRules() else None,
        layer_rules=parse_fbs_layer_validation_rules(obj.LayerRules()) if obj.LayerRules() else None,
    )

# ------------------------------
# Standard (table)
# ------------------------------

def parse_fbs_standard(obj: FBSStandard) -> DS_Standard:
    return DS_Standard(
        identifier=parse_fbs_identifier(obj.Identifier()),
        version=_s_req(obj.Version()),
        readonly=obj.Readonly(),
        overrides=parse_fbs_standard_overrides(obj.Overrides()) if obj.Overrides() else None,
        styles=parse_fbs_standard_styles(obj.Styles()) if obj.Styles() else None,
        view_settings=parse_fbs_standard_view_settings(obj.ViewSettings()) if obj.ViewSettings() else None,
        units=parse_fbs_standard_units(obj.Units()) if obj.Units() else None,
        validation=parse_fbs_standard_validation(obj.Validation()) if obj.Validation() else None,
    )
    
# ============================
# Part 3/6 continues here
# ============================

# -----------------------------------------------------------------------------
# Global/Local State
# -----------------------------------------------------------------------------

def parse_fbs_duc_global_state(obj) -> Optional[DS_DucGlobalState]:
    if obj is None:
        return None
    # Display precision (linear, angular)
    dp = DS_DisplayPrecision(
        linear=obj.DisplayPrecisionLinear() if hasattr(obj, "DisplayPrecisionLinear") else 0,
        angular=obj.DisplayPrecisionAngular() if hasattr(obj, "DisplayPrecisionAngular") else 0,
    )
    return DS_DucGlobalState(
        view_background_color=_s_req(obj.ViewBackgroundColor()),
        main_scope=_s_req(obj.MainScope()),
        dash_spacing_scale=obj.DashSpacingScale(),
        is_dash_spacing_affected_by_viewport_scale=obj.IsDashSpacingAffectedByViewportScale(),
        scope_exponent_threshold=obj.ScopeExponentThreshold(),
        dimensions_associative_by_default=obj.DimensionsAssociativeByDefault(),
        use_annotative_scaling=obj.UseAnnotativeScaling(),
        display_precision=dp,
        name=_s(obj.Name()),
        pruning_level=obj.PruningLevel() if hasattr(obj, "PruningLevel") else PRUNING_LEVEL.BALANCED,
    )

def parse_fbs_duc_local_state(obj) -> Optional[DS_DucLocalState]:
    if obj is None:
        return None
    active_grid = _read_str_vector(obj, "ActiveGridSettingsLength", "ActiveGridSettings")
    return DS_DucLocalState(
        scope=_s_req(obj.Scope()),
        active_standard_id=_s_req(obj.ActiveStandardId()),
        scroll_x=obj.ScrollX(),
        scroll_y=obj.ScrollY(),
        zoom=obj.Zoom(),
        is_binding_enabled=obj.IsBindingEnabled(),
        pen_mode=obj.PenMode(),
        view_mode_enabled=obj.ViewModeEnabled(),
        objects_snap_mode_enabled=obj.ObjectsSnapModeEnabled(),
        grid_mode_enabled=obj.GridModeEnabled(),
        outline_mode_enabled=obj.OutlineModeEnabled(),
        active_grid_settings=active_grid if active_grid else None,
        active_snap_settings=_s(obj.ActiveSnapSettings()),
        current_item_stroke=parse_fbs_element_stroke(obj.CurrentItemStroke()) if obj.CurrentItemStroke() else None,
        current_item_background=parse_fbs_element_background(obj.CurrentItemBackground()) if obj.CurrentItemBackground() else None,
        current_item_opacity=obj.CurrentItemOpacity() if hasattr(obj, "CurrentItemOpacity") else None,
        current_item_font_family=_s(obj.CurrentItemFontFamily()),
        current_item_font_size=obj.CurrentItemFontSize() if hasattr(obj, "CurrentItemFontSize") else None,
        current_item_text_align=obj.CurrentItemTextAlign() if hasattr(obj, "CurrentItemTextAlign") else None,
        current_item_roundness=obj.CurrentItemRoundness() if hasattr(obj, "CurrentItemRoundness") else None,
        current_item_start_line_head=parse_fbs_duc_head(obj.CurrentItemStartLineHead()) if obj.CurrentItemStartLineHead() else None,
        current_item_end_line_head=parse_fbs_duc_head(obj.CurrentItemEndLineHead()) if obj.CurrentItemEndLineHead() else None,
        manual_save_mode=obj.ManualSaveMode() if hasattr(obj, "ManualSaveMode") else None,
    )

# -----------------------------------------------------------------------------
# External Files
# -----------------------------------------------------------------------------

def parse_fbs_duc_external_file_data(obj: FBSDucExternalFileData) -> DS_DucExternalFileData:
    data_bytes = _read_bytes_from_numpy(obj, "DataLength", "DataAsNumpy", "Data")
    return DS_DucExternalFileData(
        mime_type=_s_req(obj.MimeType()),
        id=_s_req(obj.Id()),
        data=data_bytes,
        created=obj.Created(),
        last_retrieved=obj.LastRetrieved() if hasattr(obj, "LastRetrieved") else None,
    )

def parse_fbs_duc_external_file_entry(obj: FBSDucExternalFileEntry) -> DS_DucExternalFileEntry:
    return DS_DucExternalFileEntry(
        key=_s_req(obj.Key()),
        value=parse_fbs_duc_external_file_data(obj.Value()),
    )

# -----------------------------------------------------------------------------
# Version graph
# -----------------------------------------------------------------------------

def _parse_version_base_kwargs(obj: FBSVersionBase) -> Dict[str, Any]:
    return dict(
        id=_s_req(obj.Id()),
        parent_id=_s(obj.ParentId()),
        timestamp=obj.Timestamp(),
        description=_s(obj.Description()),
        is_manual_save=obj.IsManualSave(),
        user_id=_s(obj.UserId()),
    )

def parse_fbs_checkpoint(obj: FBSCheckpoint) -> DS_Checkpoint:
    base = obj.Base()
    base_kwargs = _parse_version_base_kwargs(base)
    data_bytes = _read_bytes_from_numpy(obj, "DataLength", "DataAsNumpy", "Data")
    return DS_Checkpoint(
        type="checkpoint",
        data=data_bytes,
        size_bytes=obj.SizeBytes(),
        **base_kwargs,
    )

def parse_fbs_json_patch_operation(obj: FBSJSONPatchOperation) -> DS_JSONPatchOperation:
    # Value stored as serialized JSON string in schema
    raw = _s(obj.Value()) or ""
    try:
        value: Any = json.loads(raw)
    except Exception:
        value = raw
    return DS_JSONPatchOperation(
        op=_s_req(obj.Op()),
        path=_s_req(obj.Path()),
        from_path=_s(obj.From()),
        value=value,
    )

def parse_fbs_delta(obj: FBSDelta) -> DS_Delta:
    base = obj.Base()
    base_kwargs = _parse_version_base_kwargs(base)
    patch = [parse_fbs_json_patch_operation(obj.Patch(i)) for i in range(obj.PatchLength())]
    return DS_Delta(
        type="delta",
        patch=patch,
        **base_kwargs,
    )

def parse_fbs_version_graph_metadata(obj: FBSVersionGraphMetadata) -> Optional[DS_VersionGraphMetadata]:
    if obj is None:
        return None
    return DS_VersionGraphMetadata(
        last_pruned=obj.LastPruned(),
        total_size=obj.TotalSize(),
    )

def parse_fbs_version_graph(obj: FBSVersionGraph) -> Optional[DS_VersionGraph]:
    if obj is None:
        return None
    checkpoints = [parse_fbs_checkpoint(obj.Checkpoints(i)) for i in range(obj.CheckpointsLength())]
    deltas = [parse_fbs_delta(obj.Deltas(i)) for i in range(obj.DeltasLength())]
    metadata = parse_fbs_version_graph_metadata(obj.Metadata()) or DS_VersionGraphMetadata(
        last_pruned=0, total_size=0
    )
    return DS_VersionGraph(
        checkpoints=checkpoints,
        deltas=deltas,
        metadata=metadata,
        user_checkpoint_version_id=_s_req(obj.UserCheckpointVersionId()) if obj.UserCheckpointVersionId() else "",
        latest_version_id=_s_req(obj.LatestVersionId()) if obj.LatestVersionId() else "",
    )

# -----------------------------------------------------------------------------
# Root API
# -----------------------------------------------------------------------------

def parse_duc(blob: IO[bytes]) -> DS_ExportedDataState:
    buffer = blob.read()
    data = FBSExportedDataState.GetRootAsExportedDataState(buffer, 0)

    # Top-level collections
    elements: List[DS_ElementWrapper] = [parse_duc_element_wrapper(data.Elements(i)) for i in range(data.ElementsLength())]
    blocks: List[DS_DucBlock] = [parse_fbs_duc_block(data.Blocks(i)) for i in range(data.BlocksLength())]
    groups: List[DS_DucGroup] = [parse_fbs_duc_group(data.Groups(i)) for i in range(data.GroupsLength())]
    regions: List[DS_DucRegion] = [parse_fbs_duc_region(data.Regions(i)) for i in range(data.RegionsLength())]
    layers: List[DS_DucLayer] = [parse_fbs_duc_layer(data.Layers(i)) for i in range(data.LayersLength())]
    standards: List[DS_Standard] = [parse_fbs_standard(data.Standards(i)) for i in range(data.StandardsLength())]

    duc_local_state: Optional[DS_DucLocalState] = parse_fbs_duc_local_state(data.DucLocalState()) if data.DucLocalState() else None
    duc_global_state: Optional[DS_DucGlobalState] = parse_fbs_duc_global_state(data.DucGlobalState()) if data.DucGlobalState() else None

    files: List[DS_DucExternalFileEntry] = [parse_fbs_duc_external_file_entry(data.ExternalFiles(i)) for i in range(data.ExternalFilesLength())]

    version_graph: Optional[DS_VersionGraph] = parse_fbs_version_graph(data.VersionGraph()) if data.VersionGraph() else None

    dictionary_entries: List[DS_DictionaryEntry] = [parse_fbs_dictionary_entry(data.Dictionary(i)) for i in range(data.DictionaryLength())]
    dictionary: Dict[str, str] = {e.key: e.value for e in dictionary_entries}

    # Thumbnail bytes
    thumbnail = _read_bytes_from_numpy(data, "ThumbnailLength", "ThumbnailAsNumpy", "Thumbnail")

    # Id field
    file_id = _s(data.Id()) if data.Id() else None

    return DS_ExportedDataState(
        type=_s_req(data.Type()),
        source=_s_req(data.Source()),
        version=_s_req(data.Version()),
        thumbnail=thumbnail,
        dictionary=dictionary,
        elements=elements,
        blocks=blocks,
        groups=groups,
        regions=regions,
        layers=layers,
        standards=standards,
        duc_local_state=duc_local_state,
        duc_global_state=duc_global_state,
        files=files,
        version_graph=version_graph,
        id=file_id,
    )
