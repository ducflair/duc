import flatbuffers
from Duc.ExportedDataState import *
from .serialize.serialize_duc_element import serialize_duc_element
from .serialize.serialize_app_state import serialize_app_state
from .serialize.serialize_binary_files import serialize_binary_files
from .constants import EXPORT_DATA_TYPES, EXPORT_SOURCE, VERSIONS
from .models.AppState import AppState
from .models.DucElement import DucElementUnion
from .models.BinaryFiles import BinaryFiles

def serialize_as_flatbuffers(elements: list[DucElementUnion], app_state: AppState, files: BinaryFiles, export_type: str) -> bytes:
    builder = flatbuffers.Builder(1024)

    # Serialize elements
    element_offsets = [serialize_duc_element(builder, element) for element in elements]
    elements_vector = ExportedDataStateStartElementsVector(builder, element_offsets)

    # Serialize appState
    app_state_offset = serialize_app_state(builder, app_state)

    # Serialize files
    binary_files_offset = serialize_binary_files(builder, files)

    # Serialize ExportedDataState
    type_offset = builder.CreateString(EXPORT_DATA_TYPES['duc'])
    source_offset = builder.CreateString(EXPORT_SOURCE)

    ExportedDataStateStart(builder)
    ExportedDataStateAddType(builder, type_offset)
    ExportedDataStateAddVersion(builder, VERSIONS['excalidraw'])
    ExportedDataStateAddSource(builder, source_offset)
    ExportedDataStateAddElements(builder, elements_vector)
    ExportedDataStateAddAppState(builder, app_state_offset)
    ExportedDataStateAddFiles(builder, binary_files_offset)
    exported_data_state_offset = ExportedDataStateEnd(builder)

    builder.Finish(exported_data_state_offset)

    return builder.Output()

def save_as_flatbuffers(elements: list[DucElementUnion], app_state: AppState, files: BinaryFiles, name: str = "Untitled") -> bytes:
    serialized = serialize_as_flatbuffers(elements, app_state, files, "local")
    return serialized
