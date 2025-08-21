"""
This module provides high-level functions for reading and writing DUC files.
"""
import os
from typing import List

# Import the parsing functions
from ducpy.parse import parse_duc
from ducpy.serialize import serialize_duc
from ducpy.classes.ElementsClass import (ElementWrapper, DucBlock, DucGroup, DucRegion, DucLayer)
from ducpy.classes.DataStateClass import DucExternalFileEntry, DucGlobalState, DucLocalState, ExportedDataState, VersionGraph, DictionaryEntry
from ducpy.classes.StandardsClass import Standard

def write_duc_file(
  file_path: str,
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
):
    """
    Serializes an ExportedDataState object to a .duc file.
    """
    serialized_data = serialize_duc(
      name=name,
      thumbnail=thumbnail,
      dictionary=dictionary,
      elements=elements,
      duc_local_state=duc_local_state,
      duc_global_state=duc_global_state,
      version_graph=version_graph,
      blocks=blocks,
      groups=groups,
      regions=regions,
      layers=layers,
      external_files=external_files,
      standards=standards,
    )
    with open(file_path, "wb") as f:
        f.write(serialized_data)

def read_duc_file(file_path: str) -> ExportedDataState:
    """
    Parses a .duc file into an ExportedDataState object.
    """
    with open(file_path, "rb") as f:
        return parse_duc(f)
