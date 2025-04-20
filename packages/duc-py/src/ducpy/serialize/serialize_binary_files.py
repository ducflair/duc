import flatbuffers
from typing import Dict
from ..Duc.BinaryFiles import (
    Start as BinaryFilesStart,
    End as BinaryFilesEnd,
    StartEntriesVector, AddEntries
)
from ..Duc.BinaryFilesEntry import (
    Start as BinaryFilesEntryStart,
    End as BinaryFilesEntryEnd,
    AddKey, AddValue
)
from ..Duc.BinaryFileData import (
    Start as BinaryFileDataStart,
    End as BinaryFileDataEnd,
    AddMimeType, AddId, StartDataVector,
    AddCreated, AddLastRetrieved, AddData
)
from ..classes.BinaryFilesClass import BinaryFiles

def serialize_binary_files(builder: flatbuffers.Builder, binary_files: Dict[str, BinaryFiles]) -> int:
    if not binary_files:
        return 0

    # Create entries vector
    entry_offsets = []
    
    for file_id, binary_file in binary_files.items():
        # Create key string
        key_offset = builder.CreateString(file_id)
        
        # Create BinaryFileData
        mime_type_offset = builder.CreateString(binary_file.mime_type) if binary_file.mime_type else None
        id_offset = builder.CreateString(binary_file.id) if binary_file.id else None
        
        # Create data vector if exists
        if binary_file.data:
            data_bytes = binary_file.data.encode('utf-8') if isinstance(binary_file.data, str) else binary_file.data
            StartDataVector(builder, len(data_bytes))
            for byte in reversed(data_bytes):
                builder.PrependUint8(byte)
            data_vector = builder.EndVector()
        else:
            data_vector = None
        
        # Create BinaryFileData table
        BinaryFileDataStart(builder)
        if mime_type_offset:
            AddMimeType(builder, mime_type_offset)
        if id_offset:
            AddId(builder, id_offset)
        if data_vector:
            AddData(builder, data_vector)
        if binary_file.created:
            AddCreated(builder, binary_file.created)
        if binary_file.last_retrieved:
            AddLastRetrieved(builder, binary_file.last_retrieved)
        value_offset = BinaryFileDataEnd(builder)
        
        # Create BinaryFilesEntry
        BinaryFilesEntryStart(builder)
        AddKey(builder, key_offset)
        AddValue(builder, value_offset)
        entry_offsets.append(BinaryFilesEntryEnd(builder))
    
    # Create entries vector
    StartEntriesVector(builder, len(entry_offsets))
    for offset in reversed(entry_offsets):
        builder.PrependUOffsetTRelative(offset)
    entries_vector = builder.EndVector()
    
    # Create BinaryFiles table
    BinaryFilesStart(builder)
    AddEntries(builder, entries_vector)
    return BinaryFilesEnd(builder)
