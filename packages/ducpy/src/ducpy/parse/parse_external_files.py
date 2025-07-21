from typing import List, Optional

from ..classes.DataStateClass import DucExternalFileData, DucExternalFileEntry
from ..Duc.DucExternalFileData import DucExternalFileData as FBSDucExternalFileData
from ..Duc.DucExternalFileEntry import DucExternalFileEntry as FBSDucExternalFileEntry

def parse_fbs_duc_external_file_data(fbs_external_file_data: FBSDucExternalFileData) -> DucExternalFileData:
    return DucExternalFileData(
        mime_type=fbs_external_file_data.MimeType().decode('utf-8'),
        id=fbs_external_file_data.Id().decode('utf-8'),
        data=bytes(fbs_external_file_data.DataAsNumpy()) if fbs_external_file_data.DataLength() > 0 else b'',
        created=fbs_external_file_data.Created(),
        last_retrieved=fbs_external_file_data.LastRetrieved()
    )

def parse_fbs_duc_external_file_entry(fbs_external_file_entry: FBSDucExternalFileEntry) -> DucExternalFileEntry:
    return DucExternalFileEntry(
        key=fbs_external_file_entry.Key().decode('utf-8'),
        value=parse_fbs_duc_external_file_data(fbs_external_file_entry.Value())
    )
