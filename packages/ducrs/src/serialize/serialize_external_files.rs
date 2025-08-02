use crate::generated::duc::{
    DucExternalFileData as FbExternalFileData, DucExternalFileDataBuilder,
    DucExternalFileEntry as FbExternalFileEntry, DucExternalFileEntryBuilder,
};
use crate::types::{DucExternalFileData, DucExternalFileEntry};
use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

pub fn serialize_duc_external_file_entry<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    entry: &DucExternalFileEntry,
) -> WIPOffset<FbExternalFileEntry<'a>> {
    let key = builder.create_string(&entry.key);
    let value = serialize_duc_external_file_data(builder, &entry.value);

    let mut entry_builder = DucExternalFileEntryBuilder::new(builder);
    entry_builder.add_key(key);
    entry_builder.add_value(value);
    entry_builder.finish()
}

fn serialize_duc_external_file_data<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    file_data: &DucExternalFileData,
) -> WIPOffset<FbExternalFileData<'a>> {
    let mime_type = builder.create_string(&file_data.mime_type);
    let id = builder.create_string(&file_data.id);
    let data = builder.create_vector(&file_data.data);

    let mut data_builder = DucExternalFileDataBuilder::new(builder);
    data_builder.add_mime_type(mime_type);
    data_builder.add_id(id);
    data_builder.add_data(data);
    data_builder.add_created(file_data.created);

    if let Some(last_retrieved) = file_data.last_retrieved {
        data_builder.add_last_retrieved(last_retrieved);
    }

    data_builder.finish()
}
