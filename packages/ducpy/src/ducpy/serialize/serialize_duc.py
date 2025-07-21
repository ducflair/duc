"""
Main serialization functions for duc.fbs schema.
This module provides the main serialization function that leverages all comprehensive classes.
"""

import flatbuffers
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


from ducpy.classes.DataStateClass import (
    ExportedDataState, DictionaryEntry, DucLocalState, DucGlobalState, VersionGraph, DucExternalFileEntry
)
from ducpy.classes.ElementsClass import ElementWrapper, DucBlock, DucGroup, DucRegion, DucLayer
from ducpy.classes.StandardsClass import Standard

# Import FlatBuffers generated classes for serialization
from ducpy.Duc.ExportedDataState import (
    ExportedDataStateStart, ExportedDataStateEnd,
    ExportedDataStateAddType, ExportedDataStateAddVersion, ExportedDataStateAddSource,
    ExportedDataStateAddThumbnail, ExportedDataStateAddDictionary, ExportedDataStateAddElements,
    ExportedDataStateAddBlocks, ExportedDataStateAddGroups, ExportedDataStateAddRegions,
    ExportedDataStateAddLayers, ExportedDataStateAddStandards, ExportedDataStateAddDucLocalState,
    ExportedDataStateAddDucGlobalState, ExportedDataStateAddFiles, ExportedDataStateAddVersionGraph,
    ExportedDataStateStartElementsVector,
    ExportedDataStateStartBlocksVector, ExportedDataStateStartGroupsVector,
    ExportedDataStateStartRegionsVector, ExportedDataStateStartLayersVector,
    ExportedDataStateStartStandardsVector, ExportedDataStateStartFilesVector,
    ExportedDataStateStartDictionaryVector
)

from ducpy.Duc.DictionaryEntry import DictionaryEntryStart, DictionaryEntryEnd, DictionaryEntryAddKey, DictionaryEntryAddValue

# Import serialization functions from dedicated files
from ducpy.serialize.serialize_elements import serialize_fbs_element_wrapper
from ducpy.serialize.serialize_duc_state import (
    serialize_fbs_duc_global_state, serialize_fbs_duc_local_state,
    serialize_fbs_duc_group, serialize_fbs_duc_layer, serialize_fbs_duc_region,
    serialize_fbs_duc_block
)
from ducpy.serialize.serialize_standards_helpers import serialize_fbs_standard
from ducpy.serialize.serialize_external_files import serialize_fbs_duc_external_file_entry
from ducpy.serialize.serialize_version_control import serialize_fbs_version_graph

from .._version import DUC_SCHEMA_VERSION


def serialize_fbs_dictionary_entry(builder: flatbuffers.Builder, entry: DictionaryEntry) -> int:
    """Serialize DictionaryEntry to FlatBuffers."""
    key_offset = builder.CreateString(entry.key)
    value_offset = builder.CreateString(entry.value)
    
    DictionaryEntryStart(builder)
    DictionaryEntryAddKey(builder, key_offset)
    DictionaryEntryAddValue(builder, value_offset)
    return DictionaryEntryEnd(builder)


def serialize_as_flatbuffers(data_state: ExportedDataState) -> bytes:
    """
    Serialize ExportedDataState to FlatBuffers using comprehensive classes.
    This function now leverages all the comprehensive classes and their serialization methods.
    """
    try:
        builder = flatbuffers.Builder(1024 * 1024)  # 1MB initial size

        # Serialize individual components using comprehensive serialization functions
        
        # Serialize elements
        elements_offsets = []
        for element_wrapper in data_state.elements:
            elements_offsets.append(serialize_fbs_element_wrapper(builder, element_wrapper))
        ExportedDataStateStartElementsVector(builder, len(elements_offsets))
        for offset in reversed(elements_offsets):
            builder.PrependUOffsetTRelative(offset)
        elements_vector = builder.EndVector()

        # Serialize blocks
        blocks_offsets = []
        for block in data_state.blocks or []:
            blocks_offsets.append(serialize_fbs_duc_block(builder, block))
        ExportedDataStateStartBlocksVector(builder, len(blocks_offsets))
        for offset in reversed(blocks_offsets):
            builder.PrependUOffsetTRelative(offset)
        blocks_vector = builder.EndVector()

        # Serialize groups
        groups_offsets = []
        for group in data_state.groups or []:
            groups_offsets.append(serialize_fbs_duc_group(builder, group))
        ExportedDataStateStartGroupsVector(builder, len(groups_offsets))
        for offset in reversed(groups_offsets):
            builder.PrependUOffsetTRelative(offset)
        groups_vector = builder.EndVector()

        # Serialize regions
        regions_offsets = []
        for region in data_state.regions or []:
            regions_offsets.append(serialize_fbs_duc_region(builder, region))
        ExportedDataStateStartRegionsVector(builder, len(regions_offsets))
        for offset in reversed(regions_offsets):
            builder.PrependUOffsetTRelative(offset)
        regions_vector = builder.EndVector()

        # Serialize layers
        layers_offsets = []
        for layer in data_state.layers or []:
            layers_offsets.append(serialize_fbs_duc_layer(builder, layer))
        ExportedDataStateStartLayersVector(builder, len(layers_offsets))
        for offset in reversed(layers_offsets):
            builder.PrependUOffsetTRelative(offset)
        layers_vector = builder.EndVector()

        # Serialize standards
        standards_offsets = []
        for standard in data_state.standards or []:
            standards_offsets.append(serialize_fbs_standard(builder, standard))
        ExportedDataStateStartStandardsVector(builder, len(standards_offsets))
        for offset in reversed(standards_offsets):
            builder.PrependUOffsetTRelative(offset)
        standards_vector = builder.EndVector()

        # Serialize states
        duc_local_state_offset = serialize_fbs_duc_local_state(builder, data_state.duc_local_state)
        duc_global_state_offset = serialize_fbs_duc_global_state(builder, data_state.duc_global_state)

        # Serialize files
        files_offsets = []
        for file_entry in data_state.files or []:
            files_offsets.append(serialize_fbs_duc_external_file_entry(builder, file_entry))
        ExportedDataStateStartFilesVector(builder, len(files_offsets))
        for offset in reversed(files_offsets):
            builder.PrependUOffsetTRelative(offset)
        files_vector = builder.EndVector()

        # Serialize version graph
        version_graph_offset = serialize_fbs_version_graph(builder, data_state.version_graph)

        # Serialize dictionary
        dictionary_offsets = []
        for entry in data_state.dictionary or []:
            dictionary_offsets.append(serialize_fbs_dictionary_entry(builder, entry))
        ExportedDataStateStartDictionaryVector(builder, len(dictionary_offsets))
        for offset in reversed(dictionary_offsets):
            builder.PrependUOffsetTRelative(offset)
        dictionary_vector = builder.EndVector()

        # Create string offsets for direct fields
        type_offset = builder.CreateString(data_state.type)
        source_offset = builder.CreateString(data_state.source)
        version_offset = builder.CreateString(data_state.version)

        thumbnail_offset = 0
        if data_state.thumbnail is not None and len(data_state.thumbnail) > 0:
            thumbnail_offset = builder.CreateByteVector(data_state.thumbnail)

        # Build the ExportedDataState FlatBuffer
        ExportedDataStateStart(builder)
        ExportedDataStateAddType(builder, type_offset)
        ExportedDataStateAddSource(builder, source_offset)
        ExportedDataStateAddVersion(builder, version_offset)
        ExportedDataStateAddThumbnail(builder, thumbnail_offset)
        ExportedDataStateAddDictionary(builder, dictionary_vector)
        ExportedDataStateAddElements(builder, elements_vector)
        ExportedDataStateAddBlocks(builder, blocks_vector)
        ExportedDataStateAddGroups(builder, groups_vector)
        ExportedDataStateAddRegions(builder, regions_vector)
        ExportedDataStateAddLayers(builder, layers_vector)
        ExportedDataStateAddStandards(builder, standards_vector)
        ExportedDataStateAddDucLocalState(builder, duc_local_state_offset)
        ExportedDataStateAddDucGlobalState(builder, duc_global_state_offset)
        ExportedDataStateAddFiles(builder, files_vector)
        ExportedDataStateAddVersionGraph(builder, version_graph_offset)

        exported_data = ExportedDataStateEnd(builder)
        builder.Finish(exported_data, b"DUC_")

        return builder.Output()

    except Exception as e:
        logger.error(f"Serialization failed with error: {str(e)}")
        # Optionally re-raise or handle more gracefully based on application needs
        raise


def serialize_duc(
  name: str,
  thumbnail: bytes = None,
  dictionary: List[DictionaryEntry] = None,
  elements: List[ElementWrapper] = None,
  duc_local_state: DucLocalState = None,
  duc_global_state: DucGlobalState = None,
  version_graph: VersionGraph = None,
  blocks: List[DucBlock] = None,
  groups: List[DucGroup] = None,
  regions: List[DucRegion] = None,
  layers: List[DucLayer] = None,
  external_files: List[DucExternalFileEntry] = None,
  standards: List[Standard] = None,
) -> bytes:
    """
    Serialize elements to DUC format with a user-friendly API.
    Users don't need to construct ExportedDataState manually.
    
    Args:
        elements: List of ElementWrapper objects containing the elements to serialize
        binary_files: Optional dictionary of binary files
        name: Optional name for the file (used in metadata)
    
    Returns:
        bytes: Serialized DUC file data
    """
    try:
        data_state = ExportedDataState(
            type="duc",
            version=DUC_SCHEMA_VERSION,
            thumbnail=thumbnail,
            source=f"ducpy_{name}",
            elements=elements,
            duc_local_state=duc_local_state,
            duc_global_state=duc_global_state,
            version_graph=version_graph,
            files=external_files,
            blocks=blocks,
            groups=groups,
            regions=regions,
            layers=layers,
            standards=standards,
            dictionary=dictionary
        )
        
        return serialize_as_flatbuffers(data_state)
    except Exception as e:
        logger.error(f"Failed to serialize DUC file: {str(e)}")
        raise


# Legacy alias for backward compatibility
save_as_flatbuffers = serialize_duc

def save_as_flatbuffers(data_state: ExportedDataState) -> bytes:
    try:
        return serialize_as_flatbuffers(data_state)
    except Exception as e:
        logger.error(f"Failed to save file: {str(e)}")
        raise
