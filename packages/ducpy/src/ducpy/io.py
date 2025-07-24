"""
This module provides high-level functions for reading and writing DUC files.
"""
import os
from ducpy.serialize.serialize_duc import serialize_as_flatbuffers
from ducpy.parse.parse_duc import parse_duc_file
from ducpy.classes.DataStateClass import ExportedDataState

def write_ducfile(data_state: ExportedDataState, file_path: str):
    """
    Serialize an ExportedDataState object to a .duc file.

    Args:
        data_state (ExportedDataState): The data state to serialize.
        file_path (str): The path to the output .duc file.
    """
    serialized_data = serialize_as_flatbuffers(data_state)
    with open(file_path, "wb") as f:
        f.write(serialized_data)

def read_ducfile(file_path: str) -> ExportedDataState:
    """
    Read and parse a .duc file into an ExportedDataState object.

    Args:
        file_path (str): The path to the .duc file.

    Returns:
        ExportedDataState: The parsed data state.
    """
    with open(file_path, "rb") as f:
        data = f.read()
    return parse_duc_file(data)
