from ..Duc.BinaryFiles import BinaryFiles as FlatBuffersBinaryFiles
import base64
from typing import Dict
from ..classes.BinaryFilesClass import BinaryFiles

def uint8array_to_data_url(data: bytes, mime_type: str) -> str:
    """Convert bytes to a data URL."""
    base64_data = base64.b64encode(data).decode('utf-8')
    return f"data:{mime_type};base64,{base64_data}"

def parse_binary_files(binary_files: FlatBuffersBinaryFiles) -> Dict[str, BinaryFiles]:
    if not binary_files:
        return {}

    files: Dict[str, BinaryFiles] = {}
    
    for i in range(binary_files.EntriesLength()):
        entry = binary_files.Entries(i)
        if not entry:
            continue

        key = entry.Key()
        value = entry.Value()
        
        if not key or not value:
            continue

        # Get binary file data
        mime_type = value.MimeType().decode('utf-8') if value.MimeType() else 'application/octet-stream'
        file_id = value.Id().decode('utf-8') if value.Id() else None
        
        # Get data as bytes
        data = bytes(value.DataAsNumpy()) if value.DataAsNumpy() is not None else None
        
        # Create BinaryFiles object
        files[key.decode('utf-8')] = BinaryFiles(
            mime_type=mime_type,
            id=file_id,
            data=data,
            created=value.Created(),
            last_retrieved=value.LastRetrieved()
        )

    return files
