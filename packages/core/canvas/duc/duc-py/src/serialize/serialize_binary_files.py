import flatbuffers
from Duc.BinaryFiles import BinaryFiles as FlatBuffersBinaryFiles
from Duc.BinaryFilesEntry import *
from Duc.BinaryFileData import *
from ..models.BinaryFiles import BinaryFiles

def serialize_binary_files(builder: flatbuffers.Builder, files: BinaryFiles) -> int:
    file_entries_offsets = []

    for key, file_data in files.items():
        key_offset = builder.CreateString(key)
        mime_type_offset = builder.CreateString(file_data.mime_type)
        id_offset = builder.CreateString(file_data.id)

        data_vector = builder.CreateByteVector(file_data.data)

        BinaryFileDataStart(builder)
        BinaryFileDataAddMimeType(builder, mime_type_offset)
        BinaryFileDataAddId(builder, id_offset)
        BinaryFileDataAddData(builder, data_vector)
        BinaryFileDataAddCreated(builder, file_data.created)
        BinaryFileDataAddLastRetrieved(builder, file_data.last_retrieved)
        file_data_offset = BinaryFileDataEnd(builder)

        BinaryFilesEntryStart(builder)
        BinaryFilesEntryAddKey(builder, key_offset)
        BinaryFilesEntryAddValue(builder, file_data_offset)
        file_entries_offsets.append(BinaryFilesEntryEnd(builder))

    FlatBuffersBinaryFiles.StartEntriesVector(builder, len(file_entries_offsets))
    for entry_offset in reversed(file_entries_offsets):
        builder.PrependUOffsetTRelative(entry_offset)
    entries_vector = builder.EndVector()

    FlatBuffersBinaryFiles.Start(builder)
    FlatBuffersBinaryFiles.AddEntries(builder, entries_vector)
    return FlatBuffersBinaryFiles.End(builder)
