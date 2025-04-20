import flatbuffers
import logging
import sys

logger = logging.getLogger(__name__)

from ..Duc.ExportedDataState import *
from .serialize_duc_element import serialize_duc_element
from .serialize_app_state import serialize_app_state
from .serialize_binary_files import serialize_binary_files
from ..utils.constants import EXPORT_DATA_TYPES, EXPORT_SOURCE, VERSIONS
from ..classes.AppStateClass import AppState
from ..classes.DucElementClass import DucElementUnion
from ..classes.BinaryFilesClass import BinaryFiles
from typing import List, Dict

def serialize_as_flatbuffers(elements: List[DucElementUnion], app_state: AppState, files: Dict[str, BinaryFiles], source: str) -> bytes:
    try:
        # Create a builder with initial size
        builder = flatbuffers.Builder(1024 * 1024)  # 1MB initial size
        
        # Serialize elements
        element_offsets = []
        for element in elements:
            element_offset = serialize_duc_element(builder, element)
            element_offsets.append(element_offset)
        
        # Create elements vector
        StartElementsVector(builder, len(element_offsets))
        for offset in reversed(element_offsets):
            builder.PrependUOffsetTRelative(offset)
        elements_vector = builder.EndVector()
        
        # Create app state offset
        app_state_offset = None
        if app_state:
            app_state_offset = serialize_app_state(builder, app_state)
        
        # Create binary files offset
        binary_files_offset = None
        if files:
            binary_files_offset = serialize_binary_files(builder, files)
        
        # Create source string offset
        source_offset = builder.CreateString(source) if source else None
        
        # Create type string offset
        type_offset = builder.CreateString(EXPORT_DATA_TYPES["duc"])
        
        # Start building ExportedDataState
        ExportedDataStateStart(builder)
        
        # Add type and version
        ExportedDataStateAddType(builder, type_offset)
        ExportedDataStateAddVersion(builder, VERSIONS["duc"])
        
        # Add elements vector
        ExportedDataStateAddElements(builder, elements_vector)
        
        # Add app state if exists
        if app_state_offset:
            ExportedDataStateAddAppState(builder, app_state_offset)
        
        # Add binary files if exists
        if binary_files_offset:
            ExportedDataStateAddFiles(builder, binary_files_offset)
        
        # Add source if exists
        if source_offset:
            ExportedDataStateAddSource(builder, source_offset)
        
        # Finish building
        exported_data = ExportedDataStateEnd(builder)
        builder.Finish(exported_data)
        
        return builder.Output()
        
    except Exception as e:
        logger.error(f"Serialization failed with error: {str(e)}")
        raise

def save_as_flatbuffers(elements: List[DucElementUnion], app_state: AppState, files: Dict[str, BinaryFiles], name: str = "Untitled") -> bytes:
    try:
        return serialize_as_flatbuffers(elements, app_state, files, EXPORT_SOURCE)
    except Exception as e:
        logger.error(f"Failed to save file: {str(e)}")
        raise
