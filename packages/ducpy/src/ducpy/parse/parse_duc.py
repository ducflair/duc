from typing import IO, List, Optional, Dict
import flatbuffers
from flatbuffers import Builder

# Import the *dataclasses*
from ..classes.DataStateClass import ExportedDataState, DictionaryEntry, DucGlobalState, DucLocalState, DucExternalFileEntry, VersionGraph, DucBlock, DucGroup, DucRegion, DucLayer, Standard, Checkpoint, JSONPatchOperation, VersionBase, VersionGraphMetadata, DucExternalFileData
from ..classes.ElementsClass import ElementWrapper

# Import FlatBuffers generated classes for parsing with aliases
from ..Duc.ExportedDataState import ExportedDataState as FBSExportedDataState
from ..Duc.DictionaryEntry import DictionaryEntry as FBSDictionaryEntry
from ..Duc.ElementWrapper import ElementWrapper as FBSElementWrapper
from ..Duc.DucBlock import DucBlock as FBSDucBlock
from ..Duc.DucGroup import DucGroup as FBSDucGroup
from ..Duc.DucRegion import DucRegion as FBSDucRegion
from ..Duc.DucLayer import DucLayer as FBSDucLayer
from ..Duc.Standard import Standard as FBSStandard
from ..Duc.DucLocalState import DucLocalState as FBSDucLocalState
from ..Duc.DucGlobalState import DucGlobalState as FBSDucGlobalState
from ..Duc.DucExternalFileEntry import DucExternalFileEntry as FBSDucExternalFileEntry
from ..Duc.VersionGraph import VersionGraph as FBSVersionGraph

# Import parsing functions from dedicated files
from .parse_duc_element import parse_duc_element_wrapper # This will handle all element-related parsing
from .parse_duc_state import parse_fbs_duc_local_state, parse_fbs_duc_global_state, parse_fbs_duc_group, parse_fbs_duc_region, parse_fbs_duc_layer, parse_fbs_standard, parse_fbs_dictionary_entry # This will handle app state and standards parsing
from .parse_external_files import parse_fbs_duc_external_file_entry # This will handle external files parsing
from .parse_version_control import parse_fbs_version_graph # This will handle version control parsing
from .parse_duc_element import parse_fbs_duc_block # Temporarily import parse_fbs_duc_block here until parse_duc_element.py is properly structured


def parse_duc(blob: IO[bytes]) -> ExportedDataState:
    buffer = blob.read()
    builder = Builder(0)
    builder.Bytes = buffer
    buf = builder.Bytes
    data = FBSExportedDataState.GetRootAsExportedDataState(buf, 0)

    # Parse top-level fields
    elements: List[ElementWrapper] = [parse_duc_element_wrapper(data.Elements(i)) for i in range(data.ElementsLength())]
    blocks: List[DucBlock] = [parse_fbs_duc_block(data.Blocks(i)) for i in range(data.BlocksLength())]
    groups: List[DucGroup] = [parse_fbs_duc_group(data.Groups(i)) for i in range(data.GroupsLength())]
    regions: List[DucRegion] = [parse_fbs_duc_region(data.Regions(i)) for i in range(data.RegionsLength())]
    layers: List[DucLayer] = [parse_fbs_duc_layer(data.Layers(i)) for i in range(data.LayersLength())]
    standards: List[Standard] = [parse_fbs_standard(data.Standards(i)) for i in range(data.StandardsLength())]
    
    duc_local_state: Optional[DucLocalState] = parse_fbs_duc_local_state(data.DucLocalState()) if data.DucLocalState() else None
    duc_global_state: Optional[DucGlobalState] = parse_fbs_duc_global_state(data.DucGlobalState()) if data.DucGlobalState() else None
    
    files: List[DucExternalFileEntry] = [parse_fbs_duc_external_file_entry(data.Files(i)) for i in range(data.FilesLength())]
    
    version_graph: VersionGraph = parse_fbs_version_graph(data.VersionGraph())

    dictionary_entries: List[DictionaryEntry] = [parse_fbs_dictionary_entry(data.Dictionary(i)) for i in range(data.DictionaryLength())]

    return ExportedDataState(
        type=data.Type().decode('utf-8'),
        source=data.Source().decode('utf-8'),
        version=data.Version().decode('utf-8'),
        thumbnail=bytes(data.ThumbnailAsNumpy()) if data.ThumbnailLength() > 0 else b'',
        dictionary={entry.key: entry.value for entry in dictionary_entries},
        elements=elements,
        blocks=blocks,
        groups=groups,
        regions=regions,
        layers=layers,
        standards=standards,
        duc_local_state=duc_local_state,
        duc_global_state=duc_global_state,
        files=files,
        version_graph=version_graph
    )
