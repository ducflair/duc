"""
External files serialization functions for duc.fbs schema.
This module provides comprehensive serialization for external files and related structures.
"""

import flatbuffers
from typing import List, Optional

# Import dataclasses from comprehensive classes
from ..classes.DataStateClass import DucExternalFileEntry, DucExternalFileData

# Import FlatBuffers generated classes
from ..Duc.DucExternalFileEntry import (
    DucExternalFileEntryStart, DucExternalFileEntryEnd,
    DucExternalFileEntryAddKey, DucExternalFileEntryAddValue
)
from ..Duc.DucExternalFileData import (
    DucExternalFileDataStart, DucExternalFileDataEnd,
    DucExternalFileDataAddMimeType, DucExternalFileDataAddId,
    DucExternalFileDataAddData, DucExternalFileDataAddCreated,
    DucExternalFileDataAddLastRetrieved, DucExternalFileDataStartDataVector
)


def serialize_fbs_duc_external_file_data(builder: flatbuffers.Builder, file_data: DucExternalFileData) -> int:
    """
    Serialize DucExternalFileData to FlatBuffers.
    """
    mime_type_offset = builder.CreateString(file_data.mime_type)
    id_offset = builder.CreateString(file_data.id)
    data_offset = builder.CreateByteVector(file_data.data) # Assuming data is bytes
    
    DucExternalFileDataStart(builder)
    DucExternalFileDataAddMimeType(builder, mime_type_offset)
    DucExternalFileDataAddId(builder, id_offset)
    DucExternalFileDataAddData(builder, data_offset)
    DucExternalFileDataAddCreated(builder, file_data.created)
    if file_data.last_retrieved is not None:
        DucExternalFileDataAddLastRetrieved(builder, file_data.last_retrieved)
    return DucExternalFileDataEnd(builder)


def serialize_fbs_duc_external_file_entry(builder: flatbuffers.Builder, file_entry: DucExternalFileEntry) -> int:
    """Serialize DucExternalFileEntry to FlatBuffers."""
    key_offset = builder.CreateString(file_entry.key)
    value_offset = serialize_fbs_duc_external_file_data(builder, file_entry.value)
    
    DucExternalFileEntryStart(builder)
    DucExternalFileEntryAddKey(builder, key_offset)
    DucExternalFileEntryAddValue(builder, value_offset)
    return DucExternalFileEntryEnd(builder)
