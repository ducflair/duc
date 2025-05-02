from ..Duc.BinaryFiles import BinaryFiles as FlatBuffersBinaryFiles
import base64
from typing import Dict, Optional
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
        file_id = value.Id().decode('utf-8') if value.Id() else key.decode('utf-8')
        
        # Get data as bytes
        data: Optional[bytes] = bytes(value.DataAsNumpy()) if value.DataAsNumpy() is not None else None
        
        # Create data URL from binary data
        data_url = uint8array_to_data_url(data, mime_type) if data else None
        
        # Get timestamps
        created = value.Created() or 0
        last_retrieved = value.LastRetrieved() or created
        
        # Create BinaryFiles object with correct parameters
        binary_file = BinaryFiles(
            mimeType=mime_type,
            id=file_id,
            created=created,
            dataURL=data_url,
            lastRetrieved=last_retrieved,
            status="saved" if data else "pending"
        )
        
        files[key.decode('utf-8')] = binary_file

    return files
