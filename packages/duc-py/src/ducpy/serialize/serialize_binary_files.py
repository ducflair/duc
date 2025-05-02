import flatbuffers
from typing import Dict, Union, Any
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

def get_attribute(obj: Union[Dict, Any], attr: str, alt_attr: str = None):
    """Safely get an attribute from an object or dictionary."""
    if isinstance(obj, dict):
        return obj.get(attr, obj.get(alt_attr) if alt_attr else None)
    return getattr(obj, attr, getattr(obj, alt_attr, None) if alt_attr else None)

def serialize_binary_files(builder: flatbuffers.Builder, binary_files: Dict[str, Union[Dict, BinaryFiles]]) -> int:
    if not binary_files:
        return 0

    # Create entries vector
    entry_offsets = []
    
    for file_id, binary_file in binary_files.items():
        # Create key string
        key_offset = builder.CreateString(file_id)
        
        # Create BinaryFileData
        mime_type = get_attribute(binary_file, "mimeType", "mime_type")
        mime_type_offset = builder.CreateString(mime_type) if mime_type else None
        
        file_id = get_attribute(binary_file, "id")
        id_offset = builder.CreateString(file_id) if file_id else None
        
        # Create data vector if exists
        data = get_attribute(binary_file, "data")
        if data:
            data_bytes = data.encode('utf-8') if isinstance(data, str) else data
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
        
        created = get_attribute(binary_file, "created")
        if created:
            AddCreated(builder, created)
        
        last_retrieved = get_attribute(binary_file, "last_retrieved", "lastRetrieved")
        if last_retrieved:
            AddLastRetrieved(builder, last_retrieved)
            
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
