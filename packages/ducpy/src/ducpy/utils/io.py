"""
This module provides high-level functions for reading and writing DUC files.
"""
import os
from typing import Any, List, Optional

from ducpy.parse import DucData, parse_duc
from ducpy.serialize import serialize_duc


def write_duc_file(
  file_path: str,
  name: str,
  thumbnail: Optional[bytes] = None,
  dictionary: Optional[list] = None,
  elements: Optional[list] = None,
  duc_local_state: Any = None,
  duc_global_state: Any = None,
  version_graph: Any = None,
  blocks: Optional[list] = None,
  block_instances: Optional[list] = None,
  block_collections: Optional[list] = None,
  groups: Optional[list] = None,
  regions: Optional[list] = None,
  layers: Optional[list] = None,
  external_files: Optional[list] = None,
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
      block_instances=block_instances,
      groups=groups,
      regions=regions,
      layers=layers,
      external_files=external_files,
    )
    with open(file_path, "wb") as f:
        f.write(serialized_data)

def read_duc_file(file_path: str) -> DucData:
    """
    Parses a .duc file into a DucData dict with attribute access.
    """
    return parse_duc(file_path)
