from Duc.BinaryFiles import BinaryFiles as FlatBuffersBinaryFiles
import base64
from ..models.BinaryFiles import BinaryFiles, BinaryFileData

def parse_binary_files(binary_files: FlatBuffersBinaryFiles) -> BinaryFiles:
    parsed_files = BinaryFiles()

    if binary_files:
        for i in range(binary_files.EntriesLength()):
            entry = binary_files.Entries(i)
            key = entry.Key().decode('utf-8')
            file_data = entry.Value()
            mime_type = file_data.MimeType().decode('utf-8')
            data_array = file_data.DataAsNumpy().tobytes()
            
            parsed_files[key] = BinaryFileData(
                mime_type=mime_type,
                id=file_data.Id().decode('utf-8'),
                data=data_array,
                created=file_data.Created(),
                last_retrieved=file_data.LastRetrieved()
            )

    return parsed_files
